require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const { dirname, join } = require("path");
const luamin = require("luamin");
const appDir = dirname(require.main.filename);
const Database = require("wow-classic-items");

var { Liquid } = require("liquidjs");
var engine = new Liquid();

const itemsDb = new Database.Items();

var metadata = {
  44569: "Naxxramas (10) - Sapphiron",
  44577: "Naxxramas (25) - Sapphiron",
  45038: "Ulduar (25) - Bosses",
  46052: "Ulduar (10) - Algalon the Observer",
  46053: "Ulduar (25) - Algalon the Observer",
  50274: "Icecrown Citadel (25) - Bosses",
  50231: "Icecrown Citadel (25) - Festergut",
  50226: "Icecrown Citadel (25) - Rotface",
  49869: "Contained in Light's Vengeance"
};

const phases = ["Pre-Bis", "T7", "T8", "T9", "T10"];
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
  // PHASE 1
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

  //PHASE 2
  // > 10M
  // - gloves
  // death knight, druid, mage, rogue
  45646: [45337, 45341, 45345, 45351, 45355, 45397, 46131],
  // warrior, hunter, shaman
  45645: [45360, 45401, 45406, 45414, 45426, 45430],
  // paladin, priest, warlock
  45644: [45370, 45376, 45383, 45387, 45392, 45419],
  // - shoulders
  // death knight, druid, mage, rogue
  45661: [45339, 45344, 45349, 45352, 45359, 45369, 45400],
  // warrior, hunter, shaman
  45660: [45363, 45404, 45410, 45415, 45428, 45433],
  // paladin, priest, warlock
  45659: [45373, 45380, 45385, 45390, 45393, 45422],
  // - legs
  // death knight, druid, mage, rogue
  45652: [45338, 45343, 45347, 45353, 45357, 45367, 45399],
  // warrior, hunter, shaman
  45651: [45362, 45403, 45409, 45416, 45427, 45432],
  // paladin, priest, warlock
  45650: [45371, 45379, 45384, 45388, 45394, 45420],
  // - chest
  // death knight, druid, mage, rogue
  45637: [45335, 45340, 45348, 45354, 45358, 45368, 45396],
  // warrior, hunter, shaman
  45636: [45364, 45405, 45411, 45413, 45424, 45429],
  // paladin, priest, warlock
  45635: [45374, 45375, 45381, 45389, 45395, 45421],
  // - head
  // death knight, druid, mage, rogue
  45649: [45336, 45342, 45346, 45356, 45365, 45398, 46313],
  // warrior, hunter, shaman
  45648: [45361, 45402, 45408, 45412, 45425, 45431],
  // paladin, priest, warlock
  45647: [45372, 45377, 45382, 45386, 45391, 45417],
  // Reply Code Alpha
  46052: [46320, 46321, 46322, 46323],

  // > 25M
  // - gloves
  // death knight, druid, mage, rogue
  45643: [46113, 46119, 46124, 46132, 46158, 46183, 46189],
  // warrior, hunter, shaman
  45642: [46142, 46148, 46164, 46199, 46200, 46207],
  // paladin, priest, warlock
  45641: [46135, 46155, 46163, 46174, 46179, 46188],
  // - shoulders
  // death knight, druid, mage, rogue
  45658: [46117, 46122, 46127, 46134, 46157, 46187, 46196],
  // warrior, hunter, shaman
  45657: [46145, 46149, 46167, 46203, 46204, 46211],
  // paladin, priest, warlock
  45656: [46136, 46152, 46165, 46177, 46182, 46190],
  // - legs
  // death knight, druid, mage, rogue
  45655: [46116, 46121, 46126, 46133, 46160, 46185, 46192],
  // warrior, hunter, shaman
  45654: [46144, 46150, 46169, 46202, 46208, 46210],
  // paladin, priest, warlock
  45653: [46139, 46153, 46170, 46176, 46181, 46195],
  // - chest
  // death knight, druid, mage, rogue
  45634: [46111, 46118, 46123, 46130, 46159, 46186, 46194],
  // warrior, hunter, shaman
  45633: [446141, 46146, 46162, 46198, 46205, 46206],
  // paladin, priest, warlock
  45632: [46137, 46154, 46168, 46173, 46178, 46193],
  // - head
  // death knight, druid, mage, rogue
  45640: [46115, 46120, 46125, 46129, 46161, 46184, 46191],
  // warrior, hunter, shaman
  45639: [46143, 46151, 46166, 46201, 46209, 46212],
  // paladin, priest, warlock
  45638: [46140, 46156, 46172, 46175, 46180, 46197],
  // Reply Code Alpha
  46053: [45588, 45618, 45608, 45614],
  // Val'anyr
  45038: [46017],

  //PHASE 3
  // Heroic tier
  // paladin, priest, warlock
  47557: [
    47788, 47789, 47790, 47791, 47792, 47793, 47794, 47795, 47796, 47797, 48029,
    48031, 48033, 48035, 48037, 48057, 48058, 48059, 48060, 48061, 48082, 48083,
    48084, 48085, 48086, 48087, 48088, 48089, 48090, 48091, 48580, 48581, 48582,
    48583, 48584, 48585, 48586, 48587, 48588, 48589, 48612, 48613, 48614, 48615,
    48616, 48617, 48618, 48619, 48620, 48621, 48642, 48643, 48644, 48645, 48646,
    48647, 48648, 48649, 48650, 48651,
  ],

  // hunter, shaman, warrior
  47558: [
    48260, 48261, 48262, 48263, 48264, 48265, 48266, 48267, 48268, 48269, 48290,
    48291, 48292, 48293, 48294, 48305, 48306, 48307, 48308, 48309, 48321, 48322,
    48323, 48324, 48325, 48326, 48327, 48328, 48329, 48330, 48351, 48352, 48353,
    48354, 48355, 48356, 48357, 48358, 48359, 48360, 48381, 48382, 48383, 48384,
    48385, 48396, 48397, 48398, 48399, 48400, 48433, 48447, 48451, 48453, 48455,
    48466, 48467, 48468, 48469, 48470,
  ],
  // death knight, druid, mage, rogue
  47559: [
    47758, 47759, 47760, 47761, 47762, 47763, 47764, 47765, 47766, 47767, 48138,
    48139, 48140, 48141, 48142, 48143, 48144, 48145, 48146, 48147, 48168, 48169,
    48170, 48171, 48172, 48173, 48174, 48175, 48176, 48177, 48198, 48199, 48200,
    48201, 48202, 48203, 48204, 48205, 48206, 48207, 48228, 48229, 48230, 48231,
    48232, 48233, 48234, 48235, 48236, 48237, 48486, 48487, 48488, 48489, 48490,
    48491, 48492, 48493, 48494, 48495, 48543, 48544, 48545, 48546, 48547, 48548,
    48549, 48550, 48551, 48552,
  ],

  // PHASE 4
  // Normal tier
  // death knight, druid, mage, rogue
  52025: [
    51125, 51126, 51127, 51128, 51129, 51130, 51131, 51132, 51133, 51134, 51135,
    51136, 51137, 51138, 51139, 51140, 51141, 51142, 51143, 51144, 51145, 51146,
    51147, 51148, 51149, 51155, 51156, 51157, 51158, 51159, 51185, 51186, 51187,
    51188, 51189,
  ],

  // paladin, priest, warlock
  52027: [
    51175, 51170, 51176, 51165, 51171, 51177, 51166, 51172, 51178, 51167, 51173,
    51179, 51168, 51174, 51180, 51169, 51205, 51181, 51160, 51206, 51182, 51161,
    51207, 51183, 51162, 51208, 51184, 51163, 51209, 51164,
  ],

  // warrior, hunter, shaman
  52026: [
    51195, 51150, 51196, 51210, 51151, 51197, 51211, 51152, 51198, 51212, 51153,
    51199, 51213, 51154, 51200, 51214, 51190, 51201, 51215, 51191, 51202, 51216,
    51192, 51203, 51217, 51193, 51204, 51218, 51194, 51219,
  ],

  // Heroic tier
  // death knight, druid, mage, rogue
  52028: [
    51295, 51306, 51300, 51296, 51280, 51307, 51301, 51297, 51281, 51308, 51302,
    51298, 51282, 51309, 51303, 51299, 51283, 51304, 51310, 51284, 51290, 51311,
    51250, 51291, 51312, 51251, 51292, 51313, 51252, 51293, 51314, 51253, 51294,
    51305, 51254,
  ],
  // paladin, priest, warlock
  52030: [
    51265, 51263, 51274, 51275, 51233, 51259, 51260, 51270, 51267, 51230, 51256,
    51276, 51261, 51266, 51272, 51255, 51231, 51277, 51262, 51271, 51268, 51232,
    51258, 51278, 51264, 51273, 51269, 51257, 51234, 51279,
  ],
  // warrior, hunter, shaman
  52029: [
    51244, 51285, 51243, 51225, 51286, 51242, 51226, 51287, 51241, 51227, 51288,
    51239, 51228, 51289, 51238, 51229, 51249, 51237, 51220, 51248, 51236, 51221,
    51247, 51235, 51222, 51246, 51240, 51223, 51245, 51224,
  ],

  // shadowmourne
  50274: [49623],
  50231: [49623],
  50226: [49623],
  49888: [49623],
  49869: [49623]
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

const eupgradesMap = {
  HEAD: "head",
  NECK: "neck",
  SHOULDERS: "shoulders",
  BACK: "back",
  CHEST: "chest",
  WRISTS: "wrists",
  HANDS: "hands",
  WAIST: "belt",
  LEGS: "legs",
  FEET: "feet",
  FINGER_1: "ring1",
  FINGER_2: "ring2",
  TRINKET_1: "trinket1",
  TRINKET_2: "trinket2",
  MAIN_HAND: "mainHand",
  OFF_HAND: "offHand",
  RANGED: "ranged",
};

var weirdItemMap = {
  "Darkmoon Card: Greatness": 44255, // intellect
  "Darkmoon Card: Greatness v1": 44254, // spirit
  "Darkmoon Card: Greatness v2": 42987, // strength
  "Darkmoon Card: Greatness v3": 44253, // agility
  "Warglaive of Azzinoth (OH)": 32838,
  "Warglaive of Azzinoth (MH)": 32837,
};

const heroicRegex = /(.*) \(H\)/;
const normalRegex = /(.*) \(N\)/;

async function fetchWowggPure() {
  const combosRequest = await fetch(
    `https://wowtbc.gg/page-data/wotlk/class-rankings/pve-rankings/page-data.json`
  );

  const combos = await combosRequest.json();
  const result = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} };

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

        // if (className == "Priest" && spec == "Shadow" && phase == "T10"){
        //   debugger;
        // }

        itemsOrdered = itemsOrdered.slice(0, 6);

        if (wowtbcGGMap[slot] && itemsOrdered.length > 0) {
          currentSpec.items[wowtbcGGMap[slot]] = itemsOrdered.map((item) => {
            const heroicMatch = heroicRegex.exec(item.name);
            const normalMatch = normalRegex.exec(item.name);

            if (weirdItemMap[item.name]) {
              found = { itemId: weirdItemMap[item.name] };
            } else {
              let itemName = heroicMatch ? heroicMatch[1] : normalMatch ? normalMatch[1] : item.name;

              const filteredItem = itemsDb.filter(
                (i) =>
                  i.name == itemName &&
                  (i.class == "Recipe" || i.slot != "Non-equippable") &&
                  i.quality != "Poor" &&
                  i.quality != "Common" &&
                  i.requiredLevel >= 70
              );

              for (const item of filteredItem) {
                const heroicVersion = item.tooltip.find(
                  (t) => t.label == "Heroic"
                );
                if (heroicMatch && heroicVersion) {
                  found = item;
                  break;
                }

                if (!heroicMatch && !heroicVersion) {
                  found = item;
                  break;
                }
              }
            }

            if (!found) {
              debugger;
            }

            let sourceString = `${item.source} - ${item.source_type}`;

            if (heroicMatch) {
              sourceString += ` (H)`;
            }

            if (item.drop_chance) {
              sourceString += ` (${Math.round(item.drop_chance * 100)}%)`;
            }

            return {
              id: found.itemId,
              name: itemsDb.find((i) => i.itemId == found.itemId).name,
              source: sourceString,
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
  const result = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} };

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
              (i) => i.name.includes(itemObj.name) && i.class == "Recipe"
            );
            if (recipe) {
              itemDependencyMap[recipe.itemId] = [itemObj.id];
              metadata[recipe.itemId] = recipe.subclass;
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
    version: `${now.getFullYear()}${
      now.getMonth() + 1
    }${now.getDate()}${now.getHours()}${now.getMinutes()}`,
    phases: {},
  };

  bisAddonData.phases = await getWowTBCData();

  engine.parseAndRender(bisListTemplate, bisAddonData).then((render) => {
    fs.writeFileSync(
      join(appDir, "..", "MeSoHordieBiS", "data", "bis_list.lua"),
      luamin.minify(render)
    );
  });

  engine.parseAndRender(metadataTemplate, { metadata }).then((render) => {
    fs.writeFileSync(
      join(appDir, "..", "MeSoHordieBiS", "data", "metadata.lua"),
      luamin.minify(render)
    );
  });

  console.log("done");
}

main();
