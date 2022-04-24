const fetch = require("node-fetch");
const cheerio = require("cheerio");

const constants = require("./consts");

var professionCache = {};
var zoneCache = {};

async function extractCraftedBy(itemId, data, resultObj) {
    if (resultObj.source.profession) return;
  
    if (data.template == "npc" && data.id == "taught-by-npc") {
      data.data.forEach((npc) => {
        constants.professions.forEach((profession) => {
          if (npc.tag.includes(profession)) {
            resultObj.source.profession = {
              name: profession,
            };
          }
        });
      });
    }
  
    if (data.template == "item" && data.id == "taught-by-item") {
      resultObj.source.profession = {
        name: await getProfessionFromRecipe(
          data.data[0].classs,
          data.data[0].subclass
        ),
      };
    }
  }
  
  function getDropChance(count, outof) {
    return (count == -1 || outof == 0 ? 0 : (count / outof) * 100).toFixed(2);
  }
  
  async function extractDroppedBy(itemId, data, resultObj) {
    if (data.template == "npc" && data.id == "dropped-by") {
      resultObj.source.drop = [];
      for (const npc of data.data) {
        resultObj.source.drop.push({
          name: npc.name,
          chance: getDropChance(npc.count, npc.outof),
          zone:
            npc.location == undefined
              ? "Unknown"
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
      const response = await fetch(
        `https://tbc.wowhead.com/items=${cl}.${subcl}`
      );
      const htmlSource = await response.text();
      const $ = cheerio.load(htmlSource);
      var professionHeader = $("h1.heading-size-1");
      var result = professionHeader[0].children[0].data.split(" ")[0];
      professionCache[`${cl}.${subcl}`] = result;
      return result;
    } catch (error) {
      return "Unknown";
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
      return "Unknown";
    }
  }
  
  async function getZoneFromLocation(id) {
    if (zoneCache[`${id}`] != undefined) {
      return zoneCache[`${id}`];
    }
    try {
      const response = await fetch(`https://tbc.wowhead.com/zone=${id}`);
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
      return "Unknown";
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
      result.currency = [];
      cost[1].forEach((c) => {
        result.currency.push({
          id: c[0],
          amount: c[1],
        });
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
          vendor: vendor.tag,
          price: extractCurrency(vendor.cost),
        });
      }
      resultObj.source.soldBy = result;
    }
  }
  
  var extractionStrategies = [
    extractCraftedBy,
    extractDroppedBy,
    extractRewardFromQuest,
    extractContainedIn,
    extractSoldBy,
  ];

  module.exports = {
    extractionStrategies    
  }