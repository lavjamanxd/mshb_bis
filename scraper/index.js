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
const Database = require("wow-classic-items");

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
  1: "HEAD",
  2: "NECK",
  3: "SHOULDERS",
  5: "CHEST",
  6: "WAIST",
  7: "LEGS",
  8: "FEET",
  9: "WRISTS",
  10: "HANDS",
  11: "FINGER_1",
  12: "FINGER_2",
  13: "TRINKET_1",
  14: "TRINKET_2",
  15: "BACK",
  17: "OFF_HAND",
  18: "RANGED",
  "Two Hand": "TWO_HAND",
  "Main Hand": "MAIN_HAND",
};

async function scrapeFromWowhead(link, page) {
  var result = [];

  await page.goto(link);
  var rows = await page.locator(".gear-planner-slots-group-slot");

  const count = await rows.count();
  var offhandEmpty = false;

  for (let i = count; i > 0; i--) {
    var line = rows.nth(i - 1);
    var itemLink = await line.locator(
      ".gear-planner-slots-group-slot-name > .gear-planner-slots-group-slot-link"
    );

    var itemName = await itemLink.innerText();
    var slot = +(await line.getAttribute("data-slot-id"));

    if (itemName == "undefined") itemName = "";
    console.log({ itemName, slot });

    if (slot == 17 && itemName == "") {
      offhandEmpty = true;
      continue;
    }

    if (itemName == "") {
      continue;
    }

    if (slot == 16 && offhandEmpty) {
      slot = "Two Hand";
    }

    if (slot == 16 && !offhandEmpty) {
      slot = "Main Hand";
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
      class: row[constants.columnIndexes["class"]].value.replace(/\s/g, ""),
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

const tierTokenMap = {
  // > 10M
  // - gloves
  // death knight, druid, mage, rogue
  40615: [39543, 39544, 39557, 39560, 39495, 39618, 39624],
  // warrior, hunter, shaman
  40614: [39609, 39622, 39582, 39591, 39593, 39601],
  // paladin, priest, warlock
  40613: [39500, 39519, 39530, 39632, 39634, 39639],
  // - shoulders
  // death knight, druid, mage, rogue
  40624: [39542, 39548, 39556, 39565, 39494, 39621, 39627],
  // warrior, hunter, shaman
  40623: [39608, 39613, 39581, 39590, 39596, 39604],
  // paladin, priest, warlock
  40622: [39499, 39518, 39529, 39631, 39637, 39642],
  // - legs
  // death knight, druid, mage, rogue
  40621: [39539, 39546, 39555, 39564, 39493, 39620, 39626],
  // warrior, hunter, shaman
  40620: [39607, 39612, 39580, 39589, 39595, 39603],
  // paladin, priest, warlock
  40619: [39498, 39517, 39528, 39630, 39636, 39641],
  // - chest
  // death knight, druid, mage, rogue
  40612: [39538, 39547, 39554, 39558, 39492, 39617, 39623],
  // warrior, hunter, shaman
  40611: [39606, 39611, 39579, 39588, 39592, 39597],
  // paladin, priest, warlock
  40610: [39497, 39515, 39523, 39629, 39633, 39638],
  // - head
  // death knight, druid, mage, rogue
  40618: [39531, 39545, 39553, 39561, 39491, 39619, 39625],
  // warrior, hunter, shaman
  40617: [39605, 39610, 39578, 39583, 39594, 39602],
  // paladin, priest, warlock
  40616: [39496, 39514, 39521, 39628, 39635, 39640],
  // Key to the Focusing Iris
  44569: [44658, 44657, 44659, 44660],

  // > 25M
  // - gloves
  // death knight, druid, mage, rogue
  40630: [40460, 40466, 40472, 40496, 40415, 40552, 40563],
  // warrior, hunter, shaman
  40629: [40527, 40545, 40504, 40509, 40515, 40520],
  // paladin, priest, warlock
  40628: [40420, 40445, 40454, 40570, 40575, 40580],
  // - shoulders
  // death knight, druid, mage, rogue
  40639: [40465, 40470, 40494, 40502, 40419, 40557, 40568],
  // warrior, hunter, shaman
  40638: [40530, 40548, 40507, 40513, 40518, 40524],
  // paladin, priest, warlock
  40637: [40424, 40450, 40459, 40573, 40578, 40584],
  // - legs
  // death knight, druid, mage, rogue
  40636: [40462, 40468, 40493, 40500, 40417, 40556, 40567],
  // warrior, hunter, shaman
  40635: [40529, 40547, 40506, 40512, 40517, 40522],
  // paladin, priest, warlock
  40634: [40422, 40448, 40457, 40572, 40577, 40583],
  // - chest
  // death knight, druid, mage, rogue
  40627: [40463, 40469, 40471, 40495, 40418, 40550, 40559],
  // warrior, hunter, shaman
  40626: [40525, 40544, 40503, 40508, 40514, 40523],
  // paladin, priest, warlock
  40625: [40423, 40449, 40458, 40569, 40574, 40579],
  // - head
  // death knight, druid, mage, rogue
  40633: [40461, 40467, 40473, 40499, 40416, 40554, 40565],
  // warrior, hunter, shaman
  40632: [40528, 40546, 40505, 40510, 40516, 40521],
  // paladin, priest, warlock
  40631: [40421, 40447, 40456, 40571, 40576, 40581],
  // Heroic Key to the Focusing Iris
  44577: [44661, 44662, 44664, 44665],
};

const wowtbcGGMap = {
  head: "head",
  neck: "neck",
  shoulder: "shoulders",
  back: "back",
  chest: "chest",
  wrist: "wrists",
  hands: "hands",
  waist: "belt",
  legs: "legs",
  feet: "feet",
  "finger 1": "ring1",
  "finger 2": "ring2",
  "trinket 1": "trinket1",
  "trinket 2": "trinket2",
  weapon: "mainHand",
  "off hand": "offHand",
  relic: "ranged",
  ranged: "ranged",
};

var weirdItemMap = {
  "Darkmoon Card: Greatness": 44255,
  "Darkmoon Card: Greatness v1": 44254,
  "Darkmoon Card: Greatness v2": 42987,
  "Darkmoon Card: Greatness v3": 44253,
  "Warglaive of Azzinoth (OH)": 32838,
  "Warglaive of Azzinoth (MH)": 32837,
};

async function fetchWowgg() {
  const itemsDb = new Database.Items();

  const combosRequest = await fetch(
    `https://wowtbc.gg/page-data/wotlk/class-rankings/pve-rankings/page-data.json`
  );

  const combos = await combosRequest.json();
  const result = { 0: {}, 1: {}, 2: {}};

  for (const combo of combos.result.pageContext.sortedList) {
    console.log(combo);

    const listName = `${combo.spec
      .toLowerCase()
      .replace(" ", "-")}-${combo.class.toLowerCase().replace(" ", "-")}`;

    const classs = combo.class;
    const spec = combo.spec
      .replace("DPS", "")
      .replace("Tank", "")
      .replace("Feral", "Feral Combat")
      .trim();

    const role = combo.role.replace("Heals", "Heal");

    const bisListRequest = await fetch(
      `https://wowtbc.gg/page-data/wotlk/bis-list/${listName}/page-data.json`
    );

    let bisList;
    try {
      bisList = await bisListRequest.json();
    } catch (e) {
      debugger;
      continue;
    }

    const data = bisList.result.pageContext;
    console.log(data);
    const bisData = data.bisList;

    console.log(`${classs} - ${spec} - ${role}`);

    const phases = ["Pre-Bis", "T7", "T8"];
    const slots = [
      "head",
      "neck",
      "shoulder",
      "back",
      "chest",
      "wrist",
      "hands",
      "waist",
      "legs",
      "feet",
      "finger 1",
      "finger 2",
      "trinket 1",
      "trinket 2",
      "weapon",
      "main hand fist",
      "main hand sword",
      "off hand",
      "relic",
      "ranged",
    ];

    for (const phase of phases) {
      var phaseIndex = phases.indexOf(phase);
      var className = classs.replace(" ", "");
      if (!result[phaseIndex][className]) {
        result[phaseIndex][className] = {
          class: className,
          specs: [],
        };
      }

      if (!result[phaseIndex][className].specs) {
        result[phaseIndex][className].specs = [];
      }

      var currentSpec = {
        class: className,
        spec: spec,
        role: role,
        items: {},
      };

      for (const slot of slots) {
        const filteredItems = bisData.filter(
          (i) => i.slot == slot && i.phase.includes(phase)
        );

        let itemsOrdered = [];

        for (const filteredItem of filteredItems) {
          if (!filteredItem.name) continue;
          if (filteredItem[phase.toLocaleLowerCase()].bis) {
            itemsOrdered = [filteredItem, ...itemsOrdered];
          } else {
            itemsOrdered.push(filteredItem);
          }
        }
        itemsOrdered = itemsOrdered.slice(0, 6);

        var orderedByvalue = itemsOrdered.sort((x, y) => x > y);

        if (
          itemsOrdered.map((x) => x.name).join("|") !==
          itemsOrdered.map((x) => x.name).join("|")
        ) {
          debugger;
        }

        if (wowtbcGGMap[slot] && itemsOrdered.length > 0) {
          currentSpec.items[wowtbcGGMap[slot]] = itemsOrdered
            .map((item) => {
              var found = itemsDb.find((i) => i.name == item.name);
              if (!found) {
                found = { itemId: weirdItemMap[item.name] };
              }

              if (!found) {
                debugger;
              }
              metadata[found.itemId] = `${item.source} - ${item.source_type}`;
              return found.itemId;
            })
            .map((id) => [id]);
        } else {
          if (itemsOrdered.length > 0) {
            debugger;
          }
        }
      }

      for (const entry of Object.entries(currentSpec.items)) {
        var slot = entry[0];
        var items = entry[1];
        for (const itemArray of items) {
          for (const tierTokenEntry of Object.entries(tierTokenMap)) {
            var found = false;
            for (const tierItem of tierTokenEntry[1]) {
              if (tierItem == itemArray[0]) {
                itemArray.push(+tierTokenEntry[0]);
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      }

      result[phaseIndex][className].specs.push(currentSpec);
    }
  }

  return result;
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

  // for (sheetIndex = 0; sheetIndex < doc.sheetCount; sheetIndex++) {
  //   var currentSheet = doc.sheetsByIndex[sheetIndex];
  //   var phaseMatches = currentSheet.title.match(/Pre-Patch/);

  //   if (phaseMatches == undefined) {
  //     continue;
  //   }

  //   var phase = -1;

  //   console.log(`scraping phase: ${phase}`);
  //   var phaseResult = await scrapeFromWeb(currentSheet);

  //   bisAddonData.phases[phase] = phaseResult;
  // }

  bisAddonData.phases = await fetchWowgg();

  // fs.writeFileSync(
  //   join(appDir, "cached_bisList.json"),
  //   JSON.stringify(bisAddonData)
  // );

  // fs.writeFileSync(
  //   join(appDir, "cached_metadata.json"),
  //   JSON.stringify(metadata)
  // );

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
