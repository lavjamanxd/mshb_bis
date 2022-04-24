require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");
const fetch = require("node-fetch");
const fs = require("fs");
const { dirname, join } = require("path");
const luamin = require("luamin");
const appDir = dirname(require.main.filename);
const cheerio = require("cheerio");
const bisListStrategies = require("./bislist_strategies");
const metadataStrategies = require("./metadata_strategies");

var { Liquid } = require("liquidjs");
var engine = new Liquid();

const doc = new GoogleSpreadsheet(process.env.MSHB_SPREADSHEET_ID);

doc.useApiKey(process.env.GOOGLE_API_KEY);

var predictionCache = {};
var metadata = {};

async function predicateItemId(row, slot) {
  var predictions = [];
  var content = row[columnIndexes[slot]].value;
  var classs = row[columnIndexes.class].value.toLowerCase();
  var spec = row[columnIndexes.spec].value.toLowerCase();
  if (
    content == null ||
    content == "NA" ||
    content == "N/A" ||
    content == "n/a" ||
    content == "na"
  )
    return [];

  var names = content.includes("http")
    ? [content.trim()]
    : content
        .replace(/\(.*?\)/g, "")
        .split("/")
        .map((n) => n.trim());

  console.log(classs + " " + spec + "-" + slot);

  console.log("cell content: " + content)
  for (const name of names) {
    console.log("\t" + name);
    var innerPredictions = [];

    if (predictionCache[name] != undefined) {
      innerPredictions.push(predictionCache[name].flat(1));
    } else {
      for (const strategy of bisListStrategies.itemLookupStrategies) {
        try {
          var result = await strategy(
            classs,
            spec,
            name,
            row[columnIndexes[slot]],
            slot
          );
          if (result != undefined) {
            console.log("\t- " + strategy.name + " found " + JSON.stringify(result));
            innerPredictions.push(result);
            if (name.match(/.*[tT](\d+)/) == undefined) {
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
      console.log(`couldnt find: ${row[columnIndexes[slot]].value}`);
      debugger;
    }

    var postPredictions = [];
    for (const strategy of bisListStrategies.postItemLookupStrategies) {
      try {
        var result = await strategy(
          classs,
          spec,
          flattenedInnerPredictions,
          row[columnIndexes[slot]],
          slot
        );
        if (result != undefined) {
          console.log("\t- " + strategy.name + " found " + JSON.stringify(result));
          postPredictions.push(result);
        }else{
          //console.log(strategy.name + " found nothing");
        }
      } catch (e) {
        debugger;
      }
    }

    for (var postItem of postPredictions.flat()){
      flattenedInnerPredictions.push(postItem)
    }

    predictions.push(flattenedInnerPredictions);
  }

  if (predictions.length == 0) {
    console.log(row[columnIndexes[slot]].value);
    debugger;
  }

  for (const itemId of predictions.flat()) {
    try {
      if (metadata[itemId] == undefined) {
        var newMetadata = await fetchMetadataForItem(itemId);

        metadata[itemId] = newMetadata;
      }
    } catch (e) {
      debugger;
    }
  }

  return predictions;
}

async function fetchMetadataForItem(itemId) {
  try {
    var resultObj = {};

    const response = await fetch(`https://tbc.wowhead.com/item=${itemId}`);

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
        if (text.trim().startsWith("WH.Gatherer.addData")) {
          var splitLines = text.trim().split("\n");
          var itemInfoData = eval(
            "var WH = { Gatherer : { addData : (a,b,data) => {return data;}}}; " +
              splitLines[0]
          );
          await extractItemInfo(itemId, itemInfoData, resultObj);
        }

        if (text.trim().startsWith("var tabsRelated")) {
          var splitLines = text.split("\n");
          var itemInfoData = [];
          var current = "";
          var progress = false;

          splitLines.forEach((line) => {
            if (line == "});") {
              current += "}; a;";
              progress = false;
              itemInfoData.push(eval(current));
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
          await extractSource(itemId, itemInfoData, resultObj);
        }
      }
    }

    return resultObj;
  } catch (error) {}
  return {};
}

async function extractItemInfo(itemId, data, resultObj) {
  resultObj.info = resultObj.info ?? {};
  for (const entry of Object.entries(data)) {
    if (entry[0] == itemId) {
      resultObj.info.slot = entry[1].jsonequip.slotbak;
    }
  }
}

async function extractSource(itemId, data, resultObj) {
  resultObj.source = {};
  for (const d of data) {
    for (const es of metadataStrategies.extractionStrategies) {
      await es(itemId, d, resultObj);
    }
  }
}

const columnIndexes = {
  class: 0,
  spec: 1,
  role: 2,
  variant: 3,
  head: 4,
  neck: 5,
  shoulders: 6,
  back: 7,
  chest: 8,
  wrists: 9,
  mainHand: 10,
  offHand: 11,
  twoHand: 12,
  hands: 13,
  belt: 14,
  legs: 15,
  feet: 16,
  ring1: 17,
  ring2: 18,
  trinket1: 19,
  trinket2: 20,
  ranged: 21,
};

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
      class: row[columnIndexes["class"]].value,
      spec: row[columnIndexes["spec"]].value,
      role: row[columnIndexes["role"]].value,
      variant: row[columnIndexes["variant"]].value,
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
    var phaseMatches = currentSheet.title.match(/Phase (\d+)/);

    if (phaseMatches == undefined) {
      continue;
    }

    var phase = +phaseMatches[1];

    console.log(`scraping phase: ${phase}`);
    var phaseResult = await scrapPhase(currentSheet);

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

  engine
    .parseAndRender(template, bisAddonData)
    .then((render) => {
      fs.writeFileSync(
        join(appDir, "..", "MeSoHordieBiS", "bis_list.lua"),
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
      join(appDir, "..", "MeSoHordieBiS", "metadata.lua"),
      luamin.minify(render)
    );
  });
}

main();
