require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const { dirname, join } = require("path");
const luamin = require("luamin");
const appDir = dirname(require.main.filename);
const classList = require("./classes.json");

var { Liquid } = require("liquidjs");
var engine = new Liquid();

const itemsDb = JSON.parse(fs.readFileSync("scraper/cata_item_db.json"));

const crystallizedFirestoneId = 71617;

var metadata = {
    [crystallizedFirestoneId]: "Firelands - Heroic Bosses"
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

const phases = ["Pre-Bis", "T11", "T12", "T13"];

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
    // death knight, druid, mage, rogue
    [65089]: [66998, 65243, 65213, 65203, 65198, 65193, 65188, 65183], // shoulder
    [67426]: [66998, 65242, 65211, 65201, 65196, 65191, 65187, 65182], // legs
    [67431]: [66998, 65180, 65185, 65189, 65194, 65199, 65209, 65240], // gloves
    [65002]: [66998, 65241, 65210, 65200, 65195, 65190, 65186, 65181], // helm
    [67425]: [66998, 65239, 65184, 65179, 65212, 65202, 65197, 65192], // chest

    // paladin, priest, warlock
    [65088]: [66998, 65238, 65233, 65228, 65223, 65218, 65263], // shoulder
    [67428]: [66998, 65236, 65231, 65227, 65222, 65217, 65261], // legs
    [67429]: [66998, 65259, 65215, 65220, 65225, 65229, 65234], // gloves
    [65001]: [66998, 65235, 65226, 65221, 65216, 65260, 65230], // helm
    [67423]: [66998, 65224, 65219, 65214, 65237, 65232, 65262], // chest

    // hunter, shaman, warrior
    [65087]: [66998, 65258, 65253, 65248, 65208, 65273, 65268], // shoulder
    [67427]: [66998, 65272, 65257, 65252, 65247, 65207, 65267], // legs
    [67430]: [66998, 65255, 65205, 65245, 65250, 65265, 65270], // gloves
    [65000]: [66998, 65256, 65251, 65246, 65206, 65271, 65266], // helm
    [67424]: [66998, 65254, 65249, 65244, 65204, 65269, 65264], // chest

    // T11 - normal
    // death knight, druid, mage, rogue
    [64314]: [60246, 60279, 60284, 60289, 60302, 60343, 60353], // shoulder
    [63682]: [60243, 60277, 60282, 60286, 60299, 60341, 60351], // helm
    // paladin, priest, warlock
    [64315]: [60252, 60253, 60262, 60348, 60358, 60362], // shoulder
    [63683]: [60249, 60256, 60258, 60346, 60356, 60359], // helm
    // hunter, shaman, warrior
    [64316]: [60306, 60311, 60317, 60322, 60327, 60331], // shoulder
    [63684]: [60303, 60308, 60315, 60320, 60325, 60328], // helm

    // T12 - HC
    // death knight, druid, mage, rogue
    [71673]: [71480, 71485, 71500, 71490, 71495, 71511, 71541], // shoulder
    [71671]: [71479, 71484, 71498, 71493, 71489, 71509, 71540], // legs
    [71669]: [71482, 71477, 71487, 71496, 71491, 71507, 71538], // gloves
    [71670]: [71478, 71483, 71497, 71488, 71492, 71508, 71539], // helm
    [71672]: [71476, 71481, 71499, 71494, 71486, 71510, 71537], // chest
    // paladin, priest, warlock
    [71680]: [71521, 71516, 71526, 71536, 71531, 71598], // shoulder
    [71678]: [71520, 71515, 71525, 71534, 71529, 71596], // legs
    [71676]: [71518, 71513, 71523, 71527, 71532, 71594], // gloves
    [71677]: [71519, 71514, 71524, 71533, 71528, 71595], // helm
    [71679]: [71512, 71522, 71517, 71530, 71535, 71597], // chest
    // hunter, shaman, warrior
    [71687]: [71505, 71551, 71546, 71556, 71603, 71608], // shoulder
    [71685]: [71504, 71545, 71550, 71555, 71602, 71607], // legs
    [71683]: [71502, 71553, 71548, 71543, 71601, 71605], // gloves
    [71684]: [71503, 71554, 71549, 71544, 71606, 71599], // helm
    [71686]: [71501, 71547, 71552, 71542, 71604, 71600], // chest

    // T12 - normal
    // death knight, druid, mage, rogue
    [71674]: [71062, 70951, 71106, 71111, 71101, 71290, 71049], // shoulder
    [71668]: [71060, 70954, 71108, 71098, 71103, 71287, 71047], // helm
    // paladin, priest, warlock
    [71681]: [71065, 70948, 71093, 71280, 71275, 71285], // shoulder
    [71675]: [71067, 71095, 70946, 71272, 71277, 71282], // helm
    // hunter, shaman, warrior
    [71688]: [71053, 71300, 71295, 71305, 71072, 70941], // shoulder
    [71682]: [71051, 71293, 71298, 71303, 70944, 71070], // helm

    // T13 - lfr
    // death knight, druid, mage, rogue
    [78874]: [78846, 78831, 78835, 78838, 78839, 78843, 78833], // shoulder
    [78871]: [78811, 78802, 78805, 78808, 78809, 78815, 78803], // legs
    [78865]: [78773, 78765, 78771, 78775, 78779, 78766, 78774], // gloves
    [78868]: [78782, 78792, 78785, 78789, 78791, 78796, 78794], // helm
    [78862]: [78758, 78754, 78755, 78757, 78760, 78824, 78759], // chest
    // paladin, priest, warlock
    [78875]: [78837, 78840, 78841, 78842, 78845, 78844], // shoulder
    [78872]: [78807, 78810, 78812, 78814, 78817, 78816], // legs
    [78866]: [78768, 78770, 78772, 78777, 78778, 78776], // gloves
    [78869]: [78788, 78787, 78790, 78795, 78798, 78797], // helm
    [78863]: [78821, 78822, 78827, 78823, 78826, 78825], // chest
    // hunter, shaman, warrior
    [78876]: [78832, 78828, 78834, 78836, 78830, 78829], // shoulder
    [78873]: [78804, 78799, 78806, 78813, 78801, 78800], // legs
    [78867]: [78769, 78761, 78762, 78767, 78764, 78763], // gloves
    [78870]: [78793, 78781, 78780, 78786, 78784, 78783], // helm
    [78864]: [78756, 78818, 78819, 78820, 78753, 78752], // chest

    // T13 - normal
    // death knight, druid, mage, rogue
    [78170]: [77012, 76978, 76753, 77017, 77022, 76216, 77027], // shoulder
    [78171]: [77011, 76977, 76751, 77016, 77020, 76214, 77026], // legs
    [78173]: [76975, 77009, 76749, 77014, 77018, 76212, 77024], // gloves
    [78172]: [76976, 77010, 76750, 77015, 77019, 76213, 77025], // helm
    [78174]: [77008, 76974, 76752, 77013, 77021, 76215, 77023], // chest
    // paladin, priest, warlock
    [78180]: [76769, 76878, 77007, 76344, 76361, 76339], // shoulder
    [78181]: [76768, 76877, 77006, 76346, 76359, 76341], // legs
    [78183]: [77004, 76766, 76875, 76357, 76348, 76343], // gloves
    [78182]: [76767, 76876, 77005, 76347, 76358, 76342], // helm
    [78184]: [76874, 77003, 76765, 76345, 76360, 76340], // chest
    // hunter, shaman, warrior
    [78175]: [77032, 76760, 77035, 77044, 76992, 76987], // shoulder
    [78176]: [77031, 76759, 77036, 77043, 76991, 76986], // legs
    [78178]: [77029, 77041, 76757, 77038, 76989, 76985], // gloves
    [78177]: [77030, 76758, 77037, 77042, 76983, 76990], // helm
    [78179]: [77028, 76756, 77039, 77040, 76988, 76984], // chest

    // T13 - HC
    // death knight, druid, mage, rogue
    [78861]: [78736, 78751, 78740, 78743, 78744, 78748, 78738], // shoulder
    [78858]: [78716, 78707, 78710, 78713, 78714, 78720, 78708], // legs
    [78855]: [78670, 78678, 78684, 78676, 78680, 78671, 78679], // gloves
    [78852]: [78687, 78697, 78694, 78696, 78690, 78701, 78699], // helm
    [78849]: [78659, 78663, 78660, 78662, 78665, 78729, 78664], // chest
    // paladin, priest, warlock
    [78859]: [78742, 78745, 78746, 78747, 78750, 78749], // shoulder
    [78856]: [78717, 78715, 78712, 78719, 78722, 78721], // legs
    [78853]: [78673, 78675, 78677, 78682, 78683, 78681], // gloves
    [78850]: [78692, 78693, 78695, 78703, 78700, 78702], // helm
    [78847]: [78726, 78727, 78732, 78728, 78731, 78730], // chest
    // hunter, shaman, warrior
    [78860]: [78737, 78733, 78739, 78741, 78735, 78734], // shoulder
    [78857]: [78709, 78718, 78711, 78704, 78706, 78705], // legs
    [78854]: [78674, 78666, 78667, 78672, 78669, 78668], // gloves
    [78851]: [78698, 78685, 78686, 78691, 78689, 78688], // helm
    [78848]: [78661, 78723, 78724, 78725, 78658, 78657], // chest

    // crystallizedFirestone
    [crystallizedFirestoneId]: [69109, 69113, 71557, 71558, 71559, 71560, 71561, 71562, 71563, 71564, 71567, 71568, 71575, 71577, 71579, 71580, 71587, 71590, 71592, 71593, 71641],
    [68915]: [69109],
    [68972]: [69113],
    [71361]: [71557],
    [71366]: [71558],
    [71360]: [71559],
    [71359]: [71560],
    [71365]: [71561],
    [71362]: [71562],
    [70929]: [71563],
    [71367]: [71564],
    [71146]: [71567],
    [71152]: [71568],
    [71151]: [71575],
    [71149]: [71577],
    [71150]: [71579],
    [71148]: [71580],
    [71147]: [71587],
    [70939]: [71590],
    [71218]: [71592],
    [71154]: [71593],
    [71640]: [71641],

    // Tarecgosa
    [69848]: [71086],
    [69815]: [71086],
    [71141]: [71086],

    // Fangs
    [77951]: [77949, 77950],
    [77952]: [77949, 77950],
    [78352]: [77949, 77950],
}

const crystallizedFirestoneUpgrades = {
    [69109]: 68915,
    [69113]: 68972,
    [71557]: 71361,
    [71558]: 71366,
    [71559]: 71360,
    [71560]: 71359,
    [71561]: 71365,
    [71562]: 71362,
    [71563]: 70929,
    [71564]: 71367,
    [71567]: 71146,
    [71568]: 71152,
    [71575]: 71151,
    [71577]: 71149,
    [71579]: 71150,
    [71580]: 71148,
    [71587]: 71147,
    [71590]: 70939,
    [71592]: 71218,
    [71593]: 71154,
    [71641]: 71640,
}

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
    "Mantle of Dying Light v2": 78747,
    "Robes of Dying Light v2": 78728,
};

var renamedItems = {
    "Pip's Solution Agitator": "Finkle's Mixer Upper",
    "Obsidian Arborweave Tunic": "Obsidian Arborweave Robes"
}

const heroicRegex = /(.*) \(H\)/;
const normalRegex = /(.*) \(N\)/;

function generatePhaseDataObject() {
    const result = {};
    phases.forEach((_, index) => {
        result[index] = {};
    });
    return result;
}

async function fetchWowggPure() {
    const result = generatePhaseDataObject();
    for (const combo of classList) {
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
                const itemsAlreadyAdded = []
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

                itemsOrdered = itemsOrdered.slice(0, 5);

                if (wowtbcGGMap[slot] && itemsOrdered.length > 0) {
                    currentSpec.items[wowtbcGGMap[slot]] = itemsOrdered.map((item) => {
                        const heroicSourceMatch = heroicRegex.exec(item.source);

                        const heroicNameMatch = heroicRegex.exec(item.name);
                        const normalNameMatch = normalRegex.exec(item.name);
                        let itemName = heroicNameMatch ? heroicNameMatch[1] : normalNameMatch ? normalNameMatch[1] : item.name;
                        let renamed = false;
                        if (renamedItems[itemName]) {
                            itemName = renamedItems[itemName];
                            renamed = true;
                        }

                        const hasSuffix = Object.entries(suffixes).find(s => itemName.endsWith(s[0]));
                        const suffixlessName = hasSuffix ? itemName.replace(` ${hasSuffix[0]}`, "") : itemName;

                        let found = undefined;

                        if (weirdItemMap[suffixlessName]) {
                            found = { id: weirdItemMap[suffixlessName] };
                        } else {
                            const filteredItem = itemsDb.filter(
                                (i) =>
                                    i.name.toLowerCase() == suffixlessName.toLowerCase() &&
                                    i.slot != 0 &&
                                    i.quality >= 2
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

                            if (!found && filteredItem.length > 1) {
                                const sortedByIlvl = filteredItem.sort((a, b) => b.ilvl - a.ilvl);
                                for (const item of sortedByIlvl) {
                                    if (!itemsAlreadyAdded.includes(item.id)) {
                                        found = item;
                                        break;
                                    }
                                }
                            }

                            if (filteredItem.length == 1) {
                                found = filteredItem[0];
                            }
                        }

                        const hasCrystallizedFirestoneUpgrade = Object.entries(crystallizedFirestoneUpgrades).find(([_, normal]) => normal == found.id);

                        if (hasCrystallizedFirestoneUpgrade) {
                            found.id = +hasCrystallizedFirestoneUpgrade[0];
                        }

                        if (!found) {
                            debugger;
                        }

                        let sourceString = `${item.source} - ${item.source_type}`;

                        if (item.drop_chance) {
                            sourceString += ` (${Math.round(item.drop_chance * 100)}%)`;
                        }

                        // const phaseAdditionalData = item[phase.toLowerCase()];

                        // const enchant = phaseAdditionalData.enchant;
                        // if (enchant.name) {
                        //   const enchantId = enchantIds[enchant.name];
                        //   const enchantItemId = itemsDb.filter((i) => i.name.includes(enchant.name));
                        //   var a = 5;
                        // }
                        itemsAlreadyAdded.push(found.id);
                        return {
                            id: found.id,
                            name: renamed ? itemName : itemsDb.find((i) => i.id == found.id).name,
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
    const result = generatePhaseDataObject();

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

                        if (crystallizedFirestoneUpgrades[itemObj.id]) {
                            metadata[crystallizedFirestoneUpgrades[itemObj.id]] = itemObj.source;
                            metadata[itemObj.id] = "Upgrade with Crystallized Firestone"
                        }

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

    items[slotName] = result.slice(0, 5);
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
            join(appDir, "..", "SimpleBiS", "data", "bis_list.lua"),
            luamin.minify(render)
        );
    });

    engine.parseAndRender(metadataTemplate, { metadata }).then((render) => {
        fs.writeFileSync(
            join(appDir, "..", "SimpleBiS", "data", "metadata.lua"),
            luamin.minify(render)
        );
    });

    console.log("done");
}

main();
