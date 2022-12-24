require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const { dirname, join } = require("path");
const luamin = require("luamin");
const appDir = dirname(require.main.filename);
const Database = require("wow-classic-items");

var { Liquid } = require("liquidjs");
var engine = new Liquid();

var metadata = {};

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
  "Darkmoon Card: Greatness": 44255,  // intellect
  "Darkmoon Card: Greatness v1": 44254, // spirit
  "Darkmoon Card: Greatness v2": 42987, // strength
  "Darkmoon Card: Greatness v3": 44253, // agility 
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

        if (
          itemsOrdered.map((x) => x.name).join("|") !==
          itemsOrdered.map((x) => x.name).join("|")
        ) {
          debugger;
        }

        if (wowtbcGGMap[slot] && itemsOrdered.length > 0) {
          currentSpec.items[wowtbcGGMap[slot]] = itemsOrdered
            .map((item) => {
              if (weirdItemMap[item.name]){
                found = { itemId: weirdItemMap[item.name] };
              }else{
                var found = itemsDb.find((i) => i.name == item.name);
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

      mergeSlots(currentSpec.items, "ring");
      mergeSlots(currentSpec.items, "trinket");
      result[phaseIndex][className].specs.push(currentSpec);
    }
  }

  return result;
}

function mergeSlots(items, slotName){
  var first = items[`${slotName}1`];
  var second = items[`${slotName}2`];
  var result = [];
  var max = Math.max(first.length, second.length);
  for (var i = 0; i < max; i++){
    if (first[i] && result.findIndex(ig => ig[0] == first[i][0]) == -1){
      result.push(first[i]);
    }
    if (second[i] && result.findIndex(ig => ig[0] == second[i][0]) == -1){
      result.push(second[i]);
    }
  }

  delete items[`${slotName}1`];
  delete items[`${slotName}2`];

  items[slotName] = result;
}

async function main() {
  var now = new Date();
  var bisAddonData = {
    version: `${now.getFullYear()}${
      now.getMonth() + 1
    }${now.getDate()}${now.getHours()}${now.getMinutes()}`,
    ordered: false,
    phases: {},
  };

  bisAddonData.phases = await fetchWowgg();

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
