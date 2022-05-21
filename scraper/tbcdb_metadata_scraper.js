const fetch = require("node-fetch");
const cheerio = require("cheerio");

const constants = require("./consts");

var zoneCache = {};
var npcZoneCache = {};
var objectZoneCache = {};
const dbUrl = "https://tbcdb.com";

var professionMap = {
  171: "Alchemy",
  164: "Blacksmithing",
  333: "Enchanting",
  202: "Engineering",
  182: "Herbalism",
  755: "Jewelcrafting",
  165: "Leatherworking",
  186: "Mining",
  393: "Skinning",
  197: "Tailoring",
};

async function extractCraftedBy(itemId, data, resultObj) {
  if (resultObj.source.profession) return;

  if (data.template == "spell" && data.id == "created-by") {
    if (!data.data[0].skill) return;
    var professionId = data.data[0].skill[0];
    resultObj.source.profession = [
      {
        name: professionMap[professionId],
      },
    ];
  }
}

async function extractDroppedBy(itemId, data, resultObj) {
  if (data.template == "npc" && data.id == "dropped-by") {
    resultObj.source.drop = [];
    for (const npc of data.data) {
      resultObj.source.drop.push({
        name: npc.name,
        chance: npc.percent,
        zone: npc.id == undefined ? "" : await getZoneFromId(npc.id, "npc"),
      });
    }
  }
}

async function getZoneFromQuestCategories(id1, id2) {
  if (zoneCache[`${id1}.${id2}`] != undefined) {
    return zoneCache[`${id1}.${id2}`];
  }
  try {
    const response = await fetch(
      `https://tbc.wowhead.com/quests=${id2}.${id1}`
    );
    const htmlSource = await response.text();
    const $ = cheerio.load(htmlSource);
    var zoneHeader = $("h1.heading-size-1");
    var result = zoneHeader[0].children[0].data.replace(" Quests", "");
    zoneCache[`${id1}.${id2}`] = result;
    return result;
  } catch (error) {
    return "";
  }
}

async function getZoneFromId(id, type) {
  var cache = type == "npc" ? npcZoneCache : objectZoneCache;
  if (cache[`${id}`] != undefined) {
    return cache[`${id}`];
  }
  try {
    const response = await fetch(`${dbUrl}/?${type}=${id}`);
    const htmlSource = await response.text();
    const $ = cheerio.load(htmlSource);
    var locationNodes = $("#locations > a");

    for (var i = 0; i < locationNodes.length; i++) {
      if (locationNodes[i].children[0]) {
        var current = locationNodes[i].children[0].data;
        cache[`${id}`] = current;
        return current;
      }
    }
  } catch (error) {
    return "";
  }

  return "";
}

async function extractRewardFromQuest(itemId, data, resultObj) {
  if (data.template == "quest" && data.id == "reward-of") {
    result = [];
    for (const quest of data.data) {
      result.push({
        zone: await getZoneFromQuestCategories(quest.category, quest.category2),
        name: quest.name,
      });
    }

    resultObj.source.quest = result;
  }
}

async function extractContainedIn(itemId, data, resultObj) {
  if (data.template == "object" && data.id == "contained-in-object") {
    result = [];
    for (const container of data.data) {
      result.push({
        zone:
          container.id == undefined
            ? ""
            : await getZoneFromId(container.id, "object"),
        name: container.name,
        chance: container.percent,
      });
    }

    resultObj.source.containedin = result;
  }
}

function extractCurrency(cost) {
  var result = {};
  if (cost[0] > 0) {
    var money = cost[0];
    var gold = Math.floor(money / 10000);
    money -= gold * 10000;
    var silver = Math.floor(money / 1000);
    money -= silver * 1000;
    var copper = Math.floor(money / 100);
    result.money = {
      gold,
      silver,
      copper,
    };
  }

  if (cost[1]) {
    result.honor = Math.abs(cost[1]);
  }

  if (cost[2]) {
    result.arena = Math.abs(cost[2]);
  }

  if (cost[3]?.length > 0) {
    result.item = [];
    cost[3].forEach((i) => {
      result.item.push({
        id: i[0],
        amount: i[1],
      });
    });
  }

  return result;
}

async function extractSoldBy(itemId, data, resultObj) {
  if (data.template == "npc" && data.id == "sold-by") {
    result = [];
    for (const vendor of data.data) {
      result.push({
        zone:
          vendor.id == undefined ? "" : await getZoneFromId(vendor.id, "npc"),
        name: vendor.name.replace('"', "'"),
        tag: vendor.tag,
        price: extractCurrency(vendor.cost),
      });
    }
    resultObj.source.soldBy = result;
  }
}

async function fetchMetadataForItem(itemId, resultObj) {
  resultObj = resultObj ?? {};
  try {
    const response = await fetch(`${dbUrl}/?item=${itemId}`);

    const htmlSource = await response.text();

    const $ = cheerio.load(htmlSource);

    var scripts = $("script");
    for (var i = 0; i < scripts.length; i++) {
      var node = $(scripts[i]);
      if (
        node[0].children[0] != undefined &&
        node[0].children[0].type == "text"
      ) {
        var text = node[0].children[0].data;
        var splitLines = text.trim().split("\n");

        if (text.trim().startsWith("var _ = g_items;")) {
          var collectedData = [];
          for (var line of splitLines.map((x) => x.trim())) {
            if (line.startsWith("new Listview({")) {
              var interestingParts = line
                .substring(13)
                .split("new Listview(")
                .map((x) => x.trim());

              for (var data of interestingParts) {
                if (
                  data.includes("lv_comments") ||
                  data.includes("disenchanting")
                )
                  continue;
                var itemInfoData = eval(
                  "var LANG = {}; var tabsRelated = {}; var Listview = {colDefs:{Common:{}}, extraCols: {}, funcBox: { createSimpleCol: () => {}}}; var a = " +
                    data.substring(0, data.length - 2) +
                    "; a;"
                );

                collectedData.push(itemInfoData);
              }
            }
          }

          await extractSource(itemId, collectedData, resultObj);
        }
      }
    }

    return resultObj;
  } catch (error) {}
  return {};
}

var extractionStrategies = [
  extractCraftedBy,
  extractDroppedBy,
  extractRewardFromQuest,
  extractContainedIn,
  extractSoldBy,
];

async function extractSource(itemId, data, resultObj) {
  resultObj.source = {};
  for (const d of data) {
    for (const es of extractionStrategies) {
      await es(itemId, d, resultObj);
    }
  }
}

module.exports = {
  fetchMetadataForItem,
};
