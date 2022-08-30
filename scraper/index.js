require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");
const fetch = require("node-fetch");
const fs = require("fs");
const { dirname, join } = require("path");
const luamin = require("luamin");
const appDir = dirname(require.main.filename);
const bisListStrategies = require("./bislist_strategies");
const wowheadMetadata = require("./wowhead_metadata_scraper");
const tbcDbMetadata = require("./tbcdb_metadata_scraper");
const constants = require("./consts");
const { chromium } = require("playwright");

var { Liquid } = require("liquidjs");
var engine = new Liquid();

const doc = new GoogleSpreadsheet(process.env.MSHB_SPREADSHEET_ID);

doc.useApiKey(process.env.GOOGLE_API_KEY);

var predictionCache = {};
var metadata = {};

async function predicateItemId(row, slot, newSpreadsheet = false) {
  var predictions = [];
  var slotId = constants.columnIndexes[slot];

  if (newSpreadsheet) {
    slotId = 3;
    if (!row || !row[slotId]) return [];
  }

  var content = row[slotId].value;

  var classs = row[constants.columnIndexes.class].value.toLowerCase();
  var spec = row[constants.columnIndexes.spec].value.toLowerCase();
  if (
    content == null ||
    content == "NA" ||
    content == "N/A" ||
    content == "n/a" ||
    content == "na"
  )
    return [];

  if ((content.match(/\//g) || []).length > 4) {
    debugger;
  }

  var names = content.includes("http")
    ? [content.trim()]
    : content
        .replace(/\(.*?\)/g, "")
        .split("/")
        .map((n) => n.trim());

  console.log(classs + " " + spec + "-" + slot);

  console.log("cell content: " + content);
  for (const name of names) {
    console.log("\t" + name);
    var innerPredictions = [];

    if (predictionCache[name] != undefined) {
      innerPredictions.push(predictionCache[name].flat(1));
    } else {
      for (const strategy of bisListStrategies.itemLookupStrategies) {
        try {
          var result = await strategy(classs, spec, name, row[slotId], slot);
          if (result != undefined) {
            console.log(
              "\t- " + strategy.name + " found " + JSON.stringify(result)
            );
            innerPredictions.push(result);
            if (
              name.match(/.*[tT](\d+)/) == undefined &&
              name != "Warglaive of Azzinoth"
            ) {
              if (predictionCache[name] == undefined) {
                predictionCache[name] = [];
              }
              predictionCache[name].push(result);
            }
            break;
          } else {
            //console.log(strategy.name + " found nothing");
          }
        } catch (e) {
          debugger;
        }
      }
    }

    var flattenedInnerPredictions = innerPredictions.flat();

    if (flattenedInnerPredictions.length == 0) {
      console.log(`couldnt find: ${row[slotId].value}`);
      debugger;
    }

    var postPredictions = [];
    for (const strategy of bisListStrategies.postItemLookupStrategies) {
      try {
        var result = await strategy(
          classs,
          spec,
          flattenedInnerPredictions,
          row[slotId],
          slot
        );
        if (result != undefined) {
          console.log(
            "\t- " + strategy.name + " found " + JSON.stringify(result)
          );
          postPredictions.push(result);
        } else {
          //console.log(strategy.name + " found nothing");
        }
      } catch (e) {
        debugger;
      }
    }

    for (var postItem of postPredictions.flat()) {
      flattenedInnerPredictions.push(postItem);
    }

    predictions.push(flattenedInnerPredictions);
  }

  if (predictions.length == 0) {
    console.log(row[slotId].value);
    debugger;
  }

  for (const itemId of predictions.flat()) {
    try {
      if (metadata[itemId] == undefined) {
        var newMetadata = await wowheadMetadata.fetchMetadataForItem(itemId);
        var newtbcDbMetadata = await tbcDbMetadata.fetchMetadataForItem(itemId);

        console.log("wowhead:");
        console.log(JSON.stringify(newMetadata));

        console.log("tbcdb:");
        console.log(JSON.stringify(newtbcDbMetadata));

        var bestMetadata = mergeAndPredictBestMetadata(
          newMetadata,
          newtbcDbMetadata
        );

        metadata[itemId] = tryReduceData(bestMetadata);
      }
    } catch (e) {
      debugger;
    }
  }

  return predictions;
}

function tryReduceData(source) {
  if (source && source.drop) {
    var zoneCounts = {};
    source.drop.forEach((x) => {
      if (zoneCounts[x.zone]) zoneCounts[x.zone]++;
      else zoneCounts[x.zone] = 1;
    });

    var result = { amount: 0 };

    Object.entries(zoneCounts).forEach((x) => {
      if (x[1] > result.amount) {
        result.amount = x[1];
        result.name = x[0];
      }
    });

    if (result.amount > 10) {
      source.drop = [{ name: "Trash mobs", zone: result.name, chance: 0 }];
    }
  }

  return source;
}

function mergeAndPredictBestMetadata(first, second) {
  var rating1 = getBestRatedSource(first.source);
  var rating2 = getBestRatedSource(second.source);

  if (!rating1) {
    return { source: { [rating2.field]: rating2.element } };
  }

  if (!rating2) {
    return { source: { [rating1.field]: rating1.element } };
  }

  var better = null;

  if (rating1.value > rating2.value) {
    better = rating1;
  } else {
    better = rating2;
  }

  return { source: { [better.field]: better.element } };
}

var groupValues = {
  soldBy: 100,
  quest: 100,
  profession: 100,
  containedin: 80,
  drop: 70,
};

var groupFields = {
  soldBy: ["zone", "name", "tag", "price"],
  quest: ["zone", "name"],
  profession: ["name"],
  containedin: ["zone", "name", "chance"],
  drop: ["name", "chance", "zone"],
};

function getBestRatedSource(source) {
  if (!source) {
    return;
  }
  var keys = Object.keys(source);
  var currentBest = -Infinity;
  var field = "";
  var element = null;

  source = tryReduceData(source);

  keys.forEach((key) => {
    var best = getRatingFor(source, key);
    if (best.value > currentBest) {
      currentBest = best.value;
      field = key;
      element = best.element;
    }
  });

  return { value: currentBest, field, element };
}

function getRatingFor(source, name) {
  if (!source[name]) return { value: -Infinity, element: null };
  result = findBestElementAndValue(source[name], groupFields[name]);
  result.value += groupValues[name];
  return result;
}

function findBestElementAndValue(sources, fields) {
  var max = -Infinity;
  var element = null;

  sources.forEach((entry) => {
    var value = calculateMissingFieldsValue(entry, fields);
    if (value > max) {
      max = value;
      element = entry;
    }
  });

  return { value: max, element };
}

function calculateMissingFieldsValue(source, fields) {
  var value = 0;
  fields.forEach((field) => {
    if (source[field]) {
      if (source[field] == "" || source[field] == 0) {
        value -= 10;
      }
    } else {
      value -= 10;
    }
  });

  return value;
}

async function scrapPhase(sheet) {
  const rows = await sheet.getRows();
  var scrapedList = [];
  await sheet.loadCells();
  for (var rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    var row = Array.from(Array(22).keys()).map((colIndex) =>
      sheet.getCell(rowIndex, colIndex)
    );

    if (row[0].value == null) break;

    scrapedList.push({
      class: row[constants.columnIndexes["class"]].value,
      spec: row[constants.columnIndexes["spec"]].value,
      role: row[constants.columnIndexes["role"]].value,
      variant: row[constants.columnIndexes["variant"]].value,
      items: {
        head: await predicateItemId(row, "head"),
        neck: await predicateItemId(row, "neck"),
        shoulders: await predicateItemId(row, "shoulders"),
        back: await predicateItemId(row, "back"),
        chest: await predicateItemId(row, "chest"),
        wrists: await predicateItemId(row, "wrists"),
        mainHand: await predicateItemId(row, "mainHand"),
        offHand: await predicateItemId(row, "offHand"),
        twoHand: await predicateItemId(row, "twoHand"),
        hands: await predicateItemId(row, "hands"),
        belt: await predicateItemId(row, "belt"),
        legs: await predicateItemId(row, "legs"),
        feet: await predicateItemId(row, "feet"),
        ring1: await predicateItemId(row, "ring1"),
        ring2: await predicateItemId(row, "ring2"),
        trinket1: await predicateItemId(row, "trinket1"),
        trinket2: await predicateItemId(row, "trinket2"),
        ranged: await predicateItemId(row, "ranged"),
      },
    });
  }

  var grouped = {};

  scrapedList.forEach((bis) => {
    if (grouped[bis.class] == undefined) {
      grouped[bis.class] = { class: bis.class, specs: [] };
    }
    grouped[bis.class].specs.push(bis);
  });

  return grouped;
}

async function scrapeFromEightyUpgrades(link, page) {
  await page.goto(link);
  await page.locator('[aria-label="Export"]').click();
  var element = await page.locator('[aria-label="Export Set"] pre').innerText();
  return JSON.parse(element);
}

const wowheadSlotMap = {
  Head: "HEAD",
  Neck: "NECK",
  Shoulder: "SHOULDERS",
  Chest: "CHEST",
  Waist: "WAIST",
  Legs: "LEGS",
  Feet: "FEET",
  Wrist: "WRISTS",
  Hands: "HANDS",
  "Finger 1": "FINGER_1",
  "Finger 2": "FINGER_2",
  "Trinket 1": "TRINKET_1",
  "Trinket 2": "TRINKET_2",
  Back: "BACK",
  "Two Hand": "TWO_HAND",
  "Main Hand": "MAIN_HAND",
  "Off Hand": "OFF_HAND",
  Ranged: "RANGED",
  Relic: "RANGED",
};

async function scrapeFromWowhead(link, page) {
  var result = [];

  await page.goto(link);
  var rows = await page.locator(".gear-planner-slots-group-slot");

  const count = await rows.count();
  var offhandEmpty = false;

  for (let i = count; i > 0; i--) {
    var line = rows.nth(i-1);
    var itemLink = await line.locator(
      ".gear-planner-slots-group-slot-name > .gear-planner-slots-group-slot-link"
    );

    var itemName = await itemLink.innerText();
    var slot = await itemLink.getAttribute("data-default-name");

    console.log({ itemName, slot });

    if (itemName == "") {
      continue;
    }

    if (itemName == slot){
      if (slot == "Off Hand"){
        offhandEmpty=true;
      }
      continue;
    }

    if (slot == "Main Hand" && offhandEmpty){
      slot == "Two Hand";
    }

    if (!wowheadSlotMap[slot]) {
      debugger;
    }

    result.push({ name: itemName, slot: wowheadSlotMap[slot] });
  }

  return result;
}

async function scrapeFromWeb(sheet) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const rows = await sheet.getRows();
  var scrapedList = [];
  await sheet.loadCells();
  for (var rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    var row = Array.from(Array(4).keys()).map((colIndex) =>
      sheet.getCell(rowIndex, colIndex)
    );

    if (row[0].value == null) break;

    var newSet = {
      class: row[constants.columnIndexes["class"]].value,
      spec: row[constants.columnIndexes["spec"]].value,
      role: row[constants.columnIndexes["role"]].value,
    };

    var link = row[3].value;
    if (!link) continue;

    var rowBase = [
      { value: newSet.class },
      { value: newSet.spec },
      { value: newSet.role },
    ];

    var itemMap = {};

    if (link.includes("eightyupgrades")) {
      var set = await scrapeFromEightyUpgrades(link, page);

      set.items.forEach((item) => {
        itemMap[item.slot] = [...rowBase, { value: item.name }];
      });
    }

    if (link.includes("wowhead")) {
      var items = await scrapeFromWowhead(link, page);

      items.forEach((item) => {
        itemMap[item.slot] = [...rowBase, { value: item.name }];
      });
    }

    newSet.items = {
      head: await predicateItemId(itemMap["HEAD"], "head", true),
      neck: await predicateItemId(itemMap["NECK"], "neck", true),
      shoulders: await predicateItemId(itemMap["SHOULDERS"], "shoulders", true),
      back: await predicateItemId(itemMap["BACK"], "back", true),
      chest: await predicateItemId(itemMap["CHEST"], "chest", true),
      wrists: await predicateItemId(itemMap["WRISTS"], "wrists", true),
      mainHand: await predicateItemId(itemMap["MAIN_HAND"], "mainHand", true),
      offHand: await predicateItemId(itemMap["OFF_HAND"], "offHand", true),
      twoHand: await predicateItemId(itemMap["TWO_HAND"], "twoHand", true),
      hands: await predicateItemId(itemMap["HANDS"], "hands", true),
      belt: await predicateItemId(itemMap["WAIST"], "belt", true),
      legs: await predicateItemId(itemMap["LEGS"], "legs", true),
      feet: await predicateItemId(itemMap["FEET"], "feet", true),
      ring1: await predicateItemId(itemMap["FINGER_1"], "ring1", true),
      ring2: await predicateItemId(itemMap["FINGER_2"], "ring2", true),
      trinket1: await predicateItemId(itemMap["TRINKET_1"], "trinket1", true),
      trinket2: await predicateItemId(itemMap["TRINKET_2"], "trinket2", true),
      ranged: await predicateItemId(itemMap["RANGED"], "ranged", true),
    };

    scrapedList.push(newSet);
  }

  browser.close();

  var grouped = {};

  scrapedList.forEach((bis) => {
    if (grouped[bis.class] == undefined) {
      grouped[bis.class] = { class: bis.class, specs: [] };
    }
    grouped[bis.class].specs.push(bis);
  });

  return grouped;
}

async function main() {
  await doc.loadInfo();
  var now = new Date();
  var bisAddonData = {
    version: `${now.getFullYear()}${
      now.getMonth() + 1
    }${now.getDate()}${now.getHours()}${now.getMinutes()}`,
    ordered: false,
    phases: {},
  };

  for (sheetIndex = 0; sheetIndex < doc.sheetCount; sheetIndex++) {
    var currentSheet = doc.sheetsByIndex[sheetIndex];
    var phaseMatches = currentSheet.title.match(/Pre-Patch/);

    if (phaseMatches == undefined) {
      continue;
    }

    var phase = -1;

    console.log(`scraping phase: ${phase}`);
    var phaseResult = await scrapeFromWeb(currentSheet);

    bisAddonData.phases[phase] = phaseResult;
  }

  fs.writeFileSync(
    join(appDir, "cached_bisList.json"),
    JSON.stringify(bisAddonData)
  );

  fs.writeFileSync(
    join(appDir, "cached_metadata.json"),
    JSON.stringify(metadata)
  );

  // var bisAddonData = JSON.parse(
  //   fs.readFileSync(join(appDir, "cached_bisList.json"))
  // );

  var template = fs.readFileSync(
    join(appDir, "./bisListTemplate.liquid"),
    "utf8"
  );

  engine.parseAndRender(template, bisAddonData).then((render) => {
    fs.writeFileSync(
      join(appDir, "..", "MeSoHordieBiS", "data", "bis_list.lua"),
      luamin.minify(render)
    );
  });

  // var metadata = JSON.parse(
  //   fs.readFileSync(join(appDir, "cached_metadata.json"))
  // );

  var template = fs.readFileSync(
    join(appDir, "./metadataTemplate.liquid"),
    "utf8"
  );

  engine.parseAndRender(template, { metadata }).then((render) => {
    fs.writeFileSync(
      join(appDir, "..", "MeSoHordieBiS", "data", "metadata.lua"),
      luamin.minify(render)
    );
  });
}

main();
