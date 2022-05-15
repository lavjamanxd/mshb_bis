const t4Tokens = [
  {
    class: ["hunter", "mage", "warlock"],
    name: "of the Fallen Hero",
    tokens: {
      hands: 29756,
      legs: 29765,
      head: 29759,
      shoulders: 29762,
      chest: 29755,
    },
  },
  {
    class: ["druid", "priest", "warrior"],
    name: "of the Fallen Defender",
    tokens: {
      hands: 29758,
      legs: 29767,
      head: 29761,
      shoulders: 29764,
      chest: 29753,
    },
  },
  {
    class: ["paladin", "rogue", "shaman"],
    name: "of the Fallen Champion",
    tokens: {
      hands: 29757,
      legs: 29766,
      head: 29760,
      shoulders: 29763,
      chest: 29754,
    },
  },
];
const t5Tokens = [
  {
    class: ["hunter", "mage", "warlock"],
    name: "of the Vanquished Hero",
    tokens: {
      hands: 30241,
      legs: 30247,
      head: 30244,
      shoulders: 30250,
      chest: 30238,
    },
  },
  {
    class: ["druid", "priest", "warrior"],
    name: "of the Vanquished Defender",
    tokens: {
      hands: 30240,
      legs: 30246,
      head: 30243,
      shoulders: 30249,
      chest: 30237,
    },
  },
  {
    class: ["paladin", "rogue", "shaman"],
    name: "of the Vanquished Champion",
    tokens: {
      hands: 30239,
      legs: 30245,
      head: 30242,
      shoulders: 30248,
      chest: 30236,
    },
  },
];
const t6Tokens = [
  {
    class: ["paladin", "priest", "warlock"],
    name: "of the Forgotten Conqueror",
    tokens: {
      hands: 31092,
      legs: 31098,
      head: 31097,
      shoulders: 31101,
      chest: 31089,
      wrists: 34848,
      belt: 34853,
      feet: 34856,
    },
  },
  {
    class: ["druid", "mage", "rogue"],
    name: "of the Forgotten Vanquisher",
    tokens: {
      hands: 31093,
      legs: 31099,
      head: 31096,
      shoulders: 31102,
      chest: 31090,
      wrists: 34852,
      belt: 34855,
      feet: 34858,
    },
  },
  {
    class: ["hunter", "shaman", "warrior"],
    name: "of the Forgotten Protector",
    tokens: {
      hands: 31094,
      legs: 31100,
      head: 31095,
      shoulders: 31103,
      chest: 31091,
      wrists: 34851,
      belt: 34854,
      feet: 34857,
    },
  },
];

const t4sets = [
  {
    class: "druid",
    sets: [
      {
        spec: ["balance"],
        set: "Malorne Regalia",
        items: {
          head: 29093,
          legs: 29094,
          chest: 29091,
          hands: 29092,
          shoulders: 29095,
        },
      },
      {
        spec: ["feral combat"],
        set: "Malorne Harness",
        items: {
          head: 29098,
          legs: 29099,
          chest: 29096,
          hands: 29097,
          shoulders: 29100,
        },
      },
      {
        spec: ["restoration"],
        set: "Malorne Raiment",
        items: {
          head: 29086,
          legs: 29088,
          chest: 29087,
          hands: 29090,
          shoulders: 29089,
        },
      },
    ],
  },
  {
    class: "hunter",
    sets: [
      {
        spec: ["beast mastery", "marksmanship", "survival"],
        set: "Demon Stalker Armor",
        items: {
          head: 29081,
          legs: 29083,
          chest: 29082,
          hands: 29085,
          shoulders: 29084,
        },
      },
    ],
  },
  {
    class: "mage",
    sets: [
      {
        spec: ["arcane", "fire", "frost"],
        set: "Aldor Regalia",
        items: {
          head: 29076,
          legs: 29078,
          chest: 29077,
          hands: 29080,
          shoulders: 29079,
        },
      },
    ],
  },
  {
    class: "paladin",
    sets: [
      {
        spec: ["holy"],
        set: "Justicar Raiment",
        items: {
          head: 29061,
          legs: 29063,
          chest: 29062,
          hands: 29065,
          shoulders: 29064,
        },
      },
      {
        spec: ["protection"],
        set: "Justicar Armor",
        items: {
          head: 29068,
          legs: 29069,
          chest: 29066,
          hands: 29067,
          shoulders: 29070,
        },
      },
      {
        spec: ["retribution"],
        set: "Justicar Battlegear",
        items: {
          head: 29073,
          legs: 29074,
          chest: 29071,
          hands: 29072,
          shoulders: 29075,
        },
      },
    ],
  },
  {
    class: "priest",
    sets: [
      {
        spec: ["discipline", "holy"],
        set: "Incarnate Raiment",
        items: {
          head: 29049,
          legs: 29053,
          chest: 29050,
          hands: 29055,
          shoulders: 29054,
        },
      },
      {
        spec: ["shadow"],
        set: "Incarnate Regalia",
        items: {
          head: 29058,
          legs: 29059,
          chest: 29056,
          hands: 29057,
          shoulders: 29060,
        },
      },
    ],
  },
  {
    class: "rogue",
    sets: [
      {
        spec: ["assasination", "combat", "subtlety"],
        set: "Netherblade",
        items: {
          head: 29044,
          legs: 29046,
          chest: 29045,
          hands: 29048,
          shoulders: 29047,
        },
      },
    ],
  },
  {
    class: "shaman",
    sets: [
      {
        spec: ["elemental"],
        set: "Cyclone Regalia",
        items: {
          head: 29035,
          legs: 29036,
          chest: 29033,
          hands: 29034,
          shoulders: 29037,
        },
      },
      {
        spec: ["enhancement"],
        set: "Cyclone Harness",
        items: {
          head: 29040,
          legs: 29042,
          chest: 29038,
          hands: 29039,
          shoulders: 29043,
        },
      },
      {
        spec: ["restoration"],
        set: "Cyclone Raiment",
        items: {
          head: 29028,
          legs: 29030,
          chest: 29029,
          hands: 29032,
          shoulders: 29031,
        },
      },
    ],
  },
  {
    class: "warlock",
    sets: [
      {
        spec: ["affliction", "demonology", "destruction"],
        set: "Voidheart Raiment",
        items: {
          head: 28963,
          legs: 28966,
          chest: 28964,
          hands: 28968,
          shoulders: 28967,
        },
      },
    ],
  },
  {
    class: "warrior",
    sets: [
      {
        spec: ["arms", "fury"],
        set: "Warbringer Battlegear",
        items: {
          head: 29021,
          legs: 29022,
          chest: 29019,
          hands: 29020,
          shoulders: 29023,
        },
      },
      {
        spec: ["protection"],
        set: "Warbringer Armor",
        items: {
          head: 29011,
          legs: 29015,
          chest: 29012,
          hands: 29017,
          shoulders: 29016,
        },
      },
    ],
  },
];
const t5sets = [
  {
    class: "druid",
    sets: [
      {
        spec: ["balance"],
        set: "Nordrassil Regalia",
        items: {
          head: 30233,
          legs: 30234,
          chest: 30231,
          hands: 30232,
          shoulders: 30235,
        },
      },
      {
        spec: ["feral combat"],
        set: "Nordrassil Harness",
        items: {
          head: 30228,
          legs: 30229,
          chest: 30222,
          hands: 30223,
          shoulders: 30230,
        },
      },
      {
        spec: ["restoration"],
        set: "Nordrassil Raiment",
        items: {
          head: 30219,
          legs: 30220,
          chest: 30216,
          hands: 30217,
          shoulders: 30221,
        },
      },
    ],
  },
  {
    class: "hunter",
    sets: [
      {
        spec: ["beast mastery", "marksmanship", "survival"],
        set: "Rift Stalker Armor",
        items: {
          head: 30141,
          legs: 30142,
          chest: 30139,
          hands: 30140,
          shoulders: 30143,
        },
      },
    ],
  },
  {
    class: "mage",
    sets: [
      {
        spec: ["arcane", "fire", "frost"],
        set: "Tirisfal Regalia",
        items: {
          head: 30206,
          legs: 30207,
          chest: 30196,
          hands: 30205,
          shoulders: 30210,
        },
      },
    ],
  },
  {
    class: "paladin",
    sets: [
      {
        spec: ["holy"],
        set: "Crystalforge Raiment",
        items: {
          head: 30136,
          legs: 30137,
          chest: 30134,
          hands: 30135,
          shoulders: 30138,
        },
      },
      {
        spec: ["protection"],
        set: "Crystalforge Armor",
        items: {
          head: 30125,
          legs: 30126,
          chest: 30123,
          hands: 30124,
          shoulders: 30127,
        },
      },
      {
        spec: ["retribution"],
        set: "Crystalforge Battlegear",
        items: {
          head: 30131,
          legs: 30132,
          chest: 30129,
          hands: 30130,
          shoulders: 30133,
        },
      },
    ],
  },
  {
    class: "priest",
    sets: [
      {
        spec: ["discipline", "holy"],
        set: "Avatar Raiment",
        items: {
          head: 30152,
          legs: 30153,
          chest: 30150,
          hands: 30151,
          shoulders: 30154,
        },
      },
      {
        spec: ["shadow"],
        set: "Avatar Regalia",
        items: {
          head: 30161,
          legs: 30162,
          chest: 30159,
          hands: 30160,
          shoulders: 30163,
        },
      },
    ],
  },
  {
    class: "rogue",
    sets: [
      {
        spec: ["assasination", "combat", "subtlety"],
        set: "Deathmantle",
        items: {
          head: 30146,
          legs: 30148,
          chest: 30144,
          hands: 30145,
          shoulders: 30149,
        },
      },
    ],
  },
  {
    class: "shaman",
    sets: [
      {
        spec: ["elemental"],
        set: "Cataclysm Regalia",
        items: {
          head: 30171,
          legs: 30172,
          chest: 30169,
          hands: 30170,
          shoulders: 30173,
        },
      },
      {
        spec: ["enhancement"],
        set: "Cataclysm Harness",
        items: {
          head: 30190,
          legs: 30192,
          chest: 30185,
          hands: 30189,
          shoulders: 30194,
        },
      },
      {
        spec: ["restoration"],
        set: "Cataclysm Raiment",
        items: {
          head: 30166,
          legs: 30167,
          chest: 30164,
          hands: 30165,
          shoulders: 30168,
        },
      },
    ],
  },
  {
    class: "warlock",
    sets: [
      {
        spec: ["affliction", "demonology", "destruction"],
        set: "Corruptor Raiment",
        items: {
          head: 30212,
          legs: 30213,
          chest: 30214,
          hands: 30211,
          shoulders: 30215,
        },
      },
    ],
  },
  {
    class: "warrior",
    sets: [
      {
        spec: ["arms", "fury"],
        set: "Destroyer Battlegear",
        items: {
          head: 30120,
          legs: 30121,
          chest: 30118,
          hands: 30119,
          shoulders: 30122,
        },
      },
      {
        spec: ["protection"],
        set: "Destroyer Armor",
        items: {
          head: 30115,
          legs: 30116,
          chest: 30113,
          hands: 30114,
          shoulders: 30117,
        },
      },
    ],
  },
];
const t6sets = [
  {
    class: "druid",
    sets: [
      {
        spec: ["balance"],
        set: "Thunderheart Regalia",
        items: {
          head: 31040,
          legs: 31046,
          chest: 31043,
          hands: 31035,
          shoulders: 31049,
          belt: 34555,
          wrists: 34446,
          feet: 34572,
        },
      },
      {
        spec: ["feral combat"],
        set: "Thunderheart Harness",
        items: {
          head: 31039,
          legs: 31044,
          chest: 31042,
          hands: 31034,
          shoulders: 31048,
          belt: 34556,
          wrists: 34444,
          feet: 34573,
        },
      },
      {
        spec: ["restoration"],
        set: "Thunderheart Raiment",
        items: {
          head: 31037,
          legs: 31045,
          chest: 31041,
          hands: 31032,
          shoulders: 31047,
          belt: 34554,
          wrists: 34445,
          feet: 34571,
        },
      },
    ],
  },
  {
    class: "hunter",
    sets: [
      {
        spec: ["beast mastery", "marksmanship", "survival"],
        set: "Gronnstalker's Armor",
        items: {
          head: 31003,
          legs: 31005,
          chest: 31004,
          hands: 31001,
          shoulders: 31006,
          belt: 34549,
          wrists: 34443,
          feet: 34570,
        },
      },
    ],
  },
  {
    class: "mage",
    sets: [
      {
        spec: ["arcane", "fire", "frost"],
        set: "Tempest Regalia",
        items: {
          head: 31056,
          legs: 31058,
          chest: 31057,
          hands: 31055,
          shoulders: 31059,
          belt: 34557,
          wrists: 34447,
          feet: 34574,
        },
      },
    ],
  },
  {
    class: "paladin",
    sets: [
      {
        spec: ["holy"],
        set: "Lightbringer Raiment",
        items: {
          head: 30988,
          legs: 30994,
          chest: 30992,
          hands: 30983,
          shoulders: 30996,
          belt: 34487,
          wrists: 34432,
          feet: 34559,
        },
      },
      {
        spec: ["protection"],
        set: "Lightbringer Armor",
        items: {
          head: 30987,
          legs: 30995,
          chest: 30991,
          hands: 30985,
          shoulders: 30998,
          belt: 34488,
          wrists: 34433,
          feet: 34560,
        },
      },
      {
        spec: ["retribution"],
        set: "Lightbringer Battlegear",
        items: {
          head: 30989,
          legs: 30993,
          chest: 30990,
          hands: 30982,
          shoulders: 30997,
          belt: 34485,
          wrists: 34431,
          feet: 34561,
        },
      },
    ],
  },
  {
    class: "priest",
    sets: [
      {
        spec: ["discipline", "holy"],
        set: "Vestments of Absolution",
        items: {
          head: 31063,
          legs: 31068,
          chest: 31066,
          hands: 31060,
          shoulders: 31069,
          belt: 34527,
          wrists: 34435,
          feet: 34562,
        },
      },
      {
        spec: ["shadow"],
        set: "Absolution Regalia",
        items: {
          head: 31064,
          legs: 31067,
          chest: 31065,
          hands: 31061,
          shoulders: 31070,
          belt: 34528,
          wrists: 34434,
          feet: 34563,
        },
      },
    ],
  },
  {
    class: "rogue",
    sets: [
      {
        spec: ["assasination", "combat", "subtlety"],
        set: "Slayer's Armor",
        items: {
          head: 31027,
          legs: 31029,
          chest: 31028,
          hands: 31026,
          shoulders: 31030,
          belt: 34558,
          wrists: 34448,
          feet: 34575,
        },
      },
    ],
  },
  {
    class: "shaman",
    sets: [
      {
        spec: ["elemental"],
        set: "Skyshatter Regalia",
        items: {
          head: 31014,
          legs: 31020,
          chest: 31017,
          hands: 31008,
          shoulders: 31023,
          belt: 34542,
          wrists: 34437,
          feet: 34566,
        },
      },
      {
        spec: ["enhancement"],
        set: "Skyshatter Harness",
        items: {
          head: 31015,
          legs: 31021,
          chest: 31018,
          hands: 31011,
          shoulders: 31024,
          belt: 34545,
          wrists: 34439,
          feet: 34567,
        },
      },
      {
        spec: ["restoration"],
        set: "Skyshatter Raiment",
        items: {
          head: 31012,
          legs: 31019,
          chest: 31016,
          hands: 31007,
          shoulders: 31022,
          belt: 34543,
          wrists: 34438,
          feet: 34565,
        },
      },
    ],
  },
  {
    class: "warlock",
    sets: [
      {
        spec: ["affliction", "demonology", "destruction"],
        set: "Malefic Raiment",
        items: {
          head: 31051,
          legs: 31053,
          chest: 31052,
          hands: 31050,
          shoulders: 31054,
          belt: 34541,
          wrists: 34436,
          feet: 34564,
        },
      },
    ],
  },
  {
    class: "warrior",
    sets: [
      {
        spec: ["arms", "fury"],
        set: "Onslaught Battlegear",
        items: {
          head: 30972,
          legs: 30977,
          chest: 30975,
          hands: 30969,
          shoulders: 30979,
          belt: 34546,
          wrists: 34441,
          feet: 34569,
        },
      },
      {
        spec: ["protection"],
        set: "Onslaught Armor",
        items: {
          head: 30974,
          legs: 30978,
          chest: 30976,
          hands: 30970,
          shoulders: 30980,
          belt: 34547,
          wrists: 34442,
          feet: 34568,
        },
      },
    ],
  },
];

const tierSets = {
  4: t4sets,
  5: t5sets,
  6: t6sets,
};

const tierTokens = {
  4: t4Tokens,
  5: t5Tokens,
  6: t6Tokens,
};

const hardcodedItems = {
  "Magtheridon's Head": 32386,
};

var sunmoteItemCombinations = {
  34405: 34339,
  34393: 34202,
  34399: 34233,
  34406: 34342,
  34386: 34170,
  34403: 34245,
  34391: 34209,
  34398: 34212,
  34384: 34169,
  34407: 34351,
  34404: 34244,
  34392: 34195,
  34397: 34211,
  34385: 34188,
  34408: 34234,
  34402: 34332,
  34390: 34208,
  34396: 34229,
  34383: 34186,
  34409: 34350,
  34401: 34243,
  34389: 34193,
  34395: 34216,
  34382: 34167,
  34400: 34345,
  34388: 34192,
  34394: 34215,
  34381: 34180,
};

const verdantSphere = 32405;
var verdantSphereRewards = [30007, 30015, 30017, 30018];

const magtheridonsHead = 32386;
var magtheridonsHeadRewards = [28792, 28793, 28790, 28791];

const warglaives = {
  mainHand: 32837,
  offHand: 32838,
};

const sunmote = 34664;

var professions = [
  "Alchemy",
  "Blacksmithing",
  "Jewelcrafting",
  "Engineering",
  "Enchanting",
  "Leatherworking",
  "Tailoring",
  "Cooking",
];

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

module.exports = {
  tierSets,
  tierTokens,
  hardcodedItems,
  warglaives,
  magtheridonsHead,
  magtheridonsHeadRewards,
  verdantSphere,
  verdantSphereRewards,
  sunmoteItemCombinations,
  professions,
  columnIndexes,
  sunmote
};
