require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const { dirname, join } = require("path");
const luamin = require("luamin");
const appDir = dirname(require.main.filename);
const Database = require("wow-classic-items");

var { Liquid } = require("liquidjs");
var engine = new Liquid();

const itemsDb = JSON.parse(fs.readFileSync("scraper/cata_item_db.json"));

var metadata = {

};

const recipeSubclass = {
  [0]: "Book",
  [1]: "Leatherworking",
  [2]: "Tailoring",
  [3]: "Engineering",
  [4]: "Blacksmithing",
  [5]: "Cooking",
  [6]: "Alchemy",
  [7]: "First Aid",
  [8]: "Enchanting",
  [9]: "Fishing",
  [10]: "Jewelcrafting",
  [11]: "Inscription"
}

const suffixes = {
  "of the Landslide": 121,
  "of the Earthfall": 122,
  "of the Earthshaker": 120,
  "of the Faultline": 118,
  "of the Zephyr": 136,
  "of the Windstorm": 137,
  "of the Stormblast": 133,
  "of the Windflurry": 135,
  "of the Undertow": 131,
  "of the Wildfire": 129,
  "of the Flameblaze": 114,
  "of the Fireflash": 130,
  "of the Feverflare": 138,
  "of the Wavecrest": 132,
  "of the Rockslab": 128,
  "of the Bedrock": 125,
  "of the Bouldercrag": 127
}

const phases = ["Pre-Bis", "T11"];
const wowTbcggSlots = [
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

const itemDependencyMap = {
  // T11 - HC
  [67431]: [66998, 65180, 65185, 65189, 65194, 65199, 65209, 65240],
  [67429]: [66998, 65259, 65215, 65220, 65225, 65229, 65234],
  [67430]: [66998, 65255, 65205, 65245, 65250, 65265, 65270],
  [67425]: [66998, 65239, 65184, 65179, 65212, 65202, 65197, 65192],
  [67423]: [66998, 65224, 65219, 65214, 65237, 65232, 65262],
  [67424]: [66998, 65254, 65249, 65244, 65204, 65269, 65264],
  [67426]: [66998, 65242, 65211, 65201, 65196, 65191, 65187, 65182],
  [67428]: [66998, 65236, 65231, 65227, 65222, 65217, 65261],
  [67427]: [66998, 65272, 65257, 65252, 65247, 65207, 65267],
  [65002]: [66998, 65241, 65210, 65200, 65195, 65190, 65186, 65181],
  [65001]: [66998, 65235, 65226, 65221, 65216, 65260, 65230],
  [65000]: [66998, 65256, 65251, 65246, 65206, 65271, 65266],
  [65089]: [66998, 65243, 65213, 65203, 65198, 65193, 65188, 65183],
  [65088]: [66998, 65238, 65233, 65228, 65223, 65218, 65263],
  [65087]: [66998, 65258, 65253, 65248, 65208, 65273, 65268],

  // T11 - normal
  [64314]: [60246, 60279, 60284, 60289, 60302, 60343, 60353],
  [64315]: [60252, 60253, 60262, 60348, 60358, 60362],
  [64316]: [60306, 60311, 60317, 60322, 60327, 60331],
  [63682]: [60243, 60277, 60282, 60286, 60299, 60341, 60351],
  [63683]: [60249, 60256, 60258, 60346, 60356, 60359],
  [63684]: [60303, 60308, 60315, 60320, 60325, 60328]

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
  "Darkmoon Card: Hurricane v2": 62049,
  "Belt of Nefarious Whisper": 56537, // typo
  "Thunder wall Belt": 65370, // typo
};

const heroicRegex = /(.*) \(H\)/;
const normalRegex = /(.*) \(N\)/;

async function fetchWowggPure() {
  const combosRequest = await fetch(
    `https://wowtbc.gg/page-data/cata/class-rankings/pve-rankings/page-data.json`
  );

  const combos = await combosRequest.json();
  const result = { 0: {}, 1: {} };
  for (const combo of combos.result.pageContext.sortedList) {
    console.log(combo);
    if (!combo.class && !combo.spec) continue;

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
      `https://wowtbc.gg/page-data/cata/bis-list/${listName}/page-data.json`
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

      for (const slot of wowTbcggSlots) {
        const filteredItems = bisData.filter(
          (i) => i.slot == slot && i.phase.includes(phase)
        );

        let itemsOrdered = [];

        for (const filteredItem of filteredItems) {
          if (!filteredItem.name) continue;
          if (filteredItem[phase.toLocaleLowerCase()]?.bis) {
            itemsOrdered = [filteredItem, ...itemsOrdered];
          } else {
            itemsOrdered.push(filteredItem);
          }
        }

        itemsOrdered = itemsOrdered.slice(0, 6);

        if (wowtbcGGMap[slot] && itemsOrdered.length > 0) {
          currentSpec.items[wowtbcGGMap[slot]] = itemsOrdered.map((item) => {
            const heroicSourceMatch = heroicRegex.exec(item.source);

            const heroicNameMatch = heroicRegex.exec(item.name);
            const normalNameMatch = normalRegex.exec(item.name);
            let itemName = heroicNameMatch ? heroicNameMatch[1] : normalNameMatch ? normalNameMatch[1] : item.name;

            const hasSuffix = Object.entries(suffixes).find(s => itemName.endsWith(s[0]));
            const suffixlessName = hasSuffix ? itemName.replace(` ${hasSuffix[0]}`, "") : itemName;

            let found = undefined;

            if (weirdItemMap[suffixlessName]) {
              found = { id: weirdItemMap[suffixlessName] };
            } else {
              const filteredItem = itemsDb.filter(
                (i) =>
                  i.name == suffixlessName &&
                  i.slot != 0 &&
                  i.quality >= 2 &&
                  i.requiredLevel >= 80
              );

              for (const item of filteredItem) {
                if ((heroicSourceMatch || heroicNameMatch) && item.heroic) {
                  found = item;
                  break;
                }

                if ((!heroicSourceMatch && !heroicNameMatch) && !item.heroic) {
                  found = item;
                  break;
                }
              }

              if (!found && filteredItem.length == 2) {
                found = filteredItem[1].ilvl > filteredItem[0].ilvl ? filteredItem[1] : filteredItem[0];
              }

              if (filteredItem.length == 1) {
                found = filteredItem[0];
              }

            }

            if (!found) {
              debugger;
            }

            let sourceString = `${item.source} - ${item.source_type}`;

            if (item.drop_chance) {
              sourceString += ` (${Math.round(item.drop_chance * 100)}%)`;
            }

            return {
              id: found.id,
              name: itemsDb.find((i) => i.id == found.id).name,
              source: sourceString,
              suffix: hasSuffix ? hasSuffix[1] : undefined,
              enchant: [],
              gems: [],
              reforge: []
            };
          });
        } else {
          if (itemsOrdered.length > 0) {
            debugger;
          }
        }
      }

      result[phaseIndex][className].specs.push(currentSpec);
    }
  }

  return result;
}

async function processPhasesWowTBCGG() {
  const result = { 0: {}, 1: {} };

  for (const phase of phases) {
    var phaseIndex = phases.indexOf(phase);

    const wowtbcDataPath = join("scraper", `phase_${phaseIndex}.json`);
    if (!fs.existsSync(wowtbcDataPath)) continue;

    const path = fs.readFileSync(wowtbcDataPath);
    let data = JSON.parse(path);

    for (const classDef of Object.values(data)) {
      let className = classDef["class"];
      result[phaseIndex][className] = {
        class: className,
        specs: [],
      };

      for (const specDef of classDef.specs) {
        var currentSpec = {
          class: className,
          spec: specDef.spec,
          role: specDef.role,
          items: {},
        };

        for (const itemSlot of Object.entries(specDef.items)) {
          currentSpec.items[itemSlot[0]] = [];
          for (const itemObj of itemSlot[1]) {
            currentSpec.items[itemSlot[0]].push([itemObj.id]);
            metadata[itemObj.id] = itemObj.source;
            const recipe = itemsDb.find(
              (i) => i.name.includes(itemObj.name) && i.class == 9
            );
            if (recipe) {
              itemDependencyMap[recipe.id] = [itemObj.id];
              metadata[recipe.id] = recipeSubclass[recipe.subclass];
            }
          }
        }

        for (const entry of Object.entries(currentSpec.items)) {
          var items = entry[1];
          for (const itemArray of items) {
            for (const itemDependencyEntry of Object.entries(
              itemDependencyMap
            )) {
              for (const depItem of itemDependencyEntry[1]) {
                if (depItem == itemArray[0]) {
                  itemArray.push(+itemDependencyEntry[0]);
                }
              }
            }
          }
        }

        mergeSlots(currentSpec.items, "ring");
        mergeSlots(currentSpec.items, "trinket");
        result[phaseIndex][className].specs.push(currentSpec);
      }
    }
  }
  return result;
}

function mergeSlots(items, slotName) {
  var first = items[`${slotName}1`];
  var second = items[`${slotName}2`];
  if (!first || !second) return;

  var result = [];
  var max = Math.max(first.length, second.length);
  for (var i = 0; i < max; i++) {
    if (first[i] && result.findIndex((ig) => ig[0] == first[i][0]) == -1) {
      result.push(first[i]);
    }
    if (second[i] && result.findIndex((ig) => ig[0] == second[i][0]) == -1) {
      result.push(second[i]);
    }
  }

  delete items[`${slotName}1`];
  delete items[`${slotName}2`];

  items[slotName] = result;
}

async function getWowTBCData() {
  const wowtbcData = await fetchWowggPure();
  for (const phase of Object.entries(wowtbcData)) {
    fs.writeFileSync(
      join(appDir, `phase_${phase[0]}.json`),
      JSON.stringify(phase[1], null, 2)
    );
  }
  return await processPhasesWowTBCGG();
}

async function main() {
  var now = new Date();

  var bisListTemplate = fs.readFileSync(
    join(appDir, "./bisListTemplate.liquid"),
    "utf8"
  );

  var metadataTemplate = fs.readFileSync(
    join(appDir, "./metadataTemplate.liquid"),
    "utf8"
  );

  var bisAddonData = {
    version: `${now.getFullYear()}${now.getMonth() + 1
      }${now.getDate()}${now.getHours()}${now.getMinutes()}`,
    phases: {},
  };

  bisAddonData.phases = await getWowTBCData();

  engine.parseAndRender(bisListTemplate, bisAddonData).then((render) => {
    fs.writeFileSync(
      join(appDir, "..", "SimpleBiSList", "data", "bis_list.lua"),
      luamin.minify(render)
    );
  });

  engine.parseAndRender(metadataTemplate, { metadata }).then((render) => {
    fs.writeFileSync(
      join(appDir, "..", "SimpleBiSList", "data", "metadata.lua"),
      luamin.minify(render)
    );
  });

  console.log("done");
}

main();
