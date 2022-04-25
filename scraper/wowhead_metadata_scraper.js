const fetch = require("node-fetch");
const cheerio = require("cheerio");

const constants = require("./consts");

var professionCache = {};
var zoneCache = {};
var npcDropCache = {};

const dbUrl = "https://tbc.wowhead.com";

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
    var professionId = data.data[0].skill[0];
    resultObj.profession = [
      {
        name: professionMap[professionId],
      },
    ];
  }

  if (data.template == "npc" && data.id == "taught-by-npc") {
    data.data.forEach((npc) => {
      constants.professions.forEach((profession) => {
        if (npc.tag.includes(profession)) {
          resultObj.source.profession = [
            {
              name: profession,
            },
          ];
        }
      });
    });
  }

  if (data.template == "item" && data.id == "taught-by-item") {
    resultObj.source.profession = [
      {
        name: await getProfessionFromRecipe(
          data.data[0].classs,
          data.data[0].subclass
        ),
      },
    ];
  }
}

function getDropChance(count, outof) {
  return (count == -1 || outof == 0 ? 0 : (count / outof) * 100).toFixed(2);
}

async function getDropFromNpcSide(itemId, npc) {
  if (!npcDropCache[npc.id]) {
    var npcDatas = await getDataFrom(npc.id, "npc");
    var dropTable = npcDatas[0];
    npcDropCache[npc.id] = {};
    for (var entry of dropTable.data) {
      npcDropCache[npc.id][entry.id] = entry.percentOverride;
    }
  }
  return npcDropCache[npc.id][itemId];
}

async function tryGetDropChance(itemId, npc) {
  if (npc.percentOverride) return npc.percentOverride;

  if (npc.count > -1 && npc.outof > 0)
    return getDropChance(npc.count, npc.outof);

  return await getDropFromNpcSide(itemId, npc);
}

async function extractDroppedBy(itemId, data, resultObj) {
  if (data.template == "npc" && data.id == "dropped-by") {
    resultObj.source.drop = [];
    for (const npc of data.data) {
      resultObj.source.drop.push({
        name: npc.name,
        chance: await tryGetDropChance(itemId, npc),
        zone:
          npc.location == undefined
            ? ""
            : await getZoneFromLocation(npc.location[0]),
      });
    }
  }
}

async function getProfessionFromRecipe(cl, subcl) {
  if (professionCache[`${cl}.${subcl}`] != undefined) {
    return professionCache[`${cl}.${subcl}`];
  }
  try {
    const response = await fetch(`${dbUrl}/items=${cl}.${subcl}`);
    const htmlSource = await response.text();
    const $ = cheerio.load(htmlSource);
    var professionHeader = $("h1.heading-size-1");
    var result = professionHeader[0].children[0].data.split(" ")[0];
    professionCache[`${cl}.${subcl}`] = result;
    return result;
  } catch (error) {
    return "";
  }
}

async function getZoneFromQuestCategories(id1, id2) {
  if (zoneCache[`${id1}.${id2}`] != undefined) {
    return zoneCache[`${id1}.${id2}`];
  }
  try {
    const response = await fetch(`${dbUrl}/quests=${id2}.${id1}`);
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

async function getZoneFromLocation(id) {
  if (zoneCache[`${id}`] != undefined) {
    return zoneCache[`${id}`];
  }
  try {
    const response = await fetch(`${dbUrl}/zone=${id}`);
    const htmlSource = await response.text();
    const $ = cheerio.load(htmlSource);
    var zoneHeader = $("h1.heading-size-1 > span");
    if (zoneHeader[0] == undefined) {
      zoneHeader = $("h1.heading-size-1");
    }
    var result = zoneHeader[0].children[0].data;
    zoneCache[`${id}`] = result;
    return result;
  } catch (error) {
    return "";
  }
}

async function extractRewardFromQuest(itemId, data, resultObj) {
  if (data.template == "quest" && data.id == "reward-from-q") {
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
          container.location == undefined
            ? ""
            : await getZoneFromLocation(container.location[0]),
        name: container.name,
        chance: getDropChance(container.count, container.outof),
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

  if (cost[1]?.length > 0) {
    cost[1].forEach((c) => {
      switch (c[0]) {
        case 1900: //arena points
          result.arena = c[1];
          break;
        case 1901: //honor points
          result.honor = c[1];
          break;
      }
    });
  }

  if (cost[2]?.length > 0) {
    result.item = [];
    cost[2].forEach((i) => {
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
          vendor.location == undefined
            ? ""
            : await getZoneFromLocation(vendor.location[0]),
        name: vendor.name.replace('"', "'"),
        tag: vendor.tag,
        price: extractCurrency(vendor.cost),
      });
    }
    resultObj.source.soldBy = result;
  }
}

async function getDataFrom(id, type) {
  try {
    const response = await fetch(`${dbUrl}/${type}=${id}`);

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

        if (
          text.trim().startsWith("//<![CDATA[\nWH.Gatherer.addData") &&
          type == "npc"
        ) {
          var splitLines = text.trim().split("\n");
          for (var line of splitLines) {
            var interestingPart = line.substring(13);

            if (interestingPart.startsWith("{template: 'item',")) {
              var a = eval(
                `var WH = {TERMS: {}}; var tabsRelated = null; var Listview = { funcBox: {}}; var a = ${interestingPart.substring(
                  0,
                  interestingPart.length - 2
                )}; a;`
              );
              return [a];
            }
          }
        }

        if (text.trim().startsWith("var tabsRelated") && type == "item") {
          var splitLines = text.split("\n");
          var infoData = [];
          var current = "";
          var progress = false;

          splitLines.forEach((line) => {
            if (line == "});") {
              current += "}; a;";
              progress = false;
              infoData.push(eval(current));
              current = "";
            }

            if (progress) {
              if (!line.includes("Listview") && !line.includes("WH.")) {
                current += line;
              }
            }

            if (line == "new Listview({") {
              current = "var a = {";
              progress = true;
            }
          });

          return infoData;
        }
      }
    }
  } catch (error) {
    return {};
  }
  return {};
}

async function fetchMetadataForItem(itemId, resultObj) {
  resultObj = resultObj ?? {};
  var itemInfoData = await getDataFrom(itemId, "item");
  await extractSource(itemId, itemInfoData, resultObj);
  return resultObj;
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
