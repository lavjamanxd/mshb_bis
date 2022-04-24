const fetch = require("node-fetch");

const constants = require("./consts");

function linkLookup(pclass, spec, name, cell, slot) {
  var matches = cell.value.match(/item=(\d+)/);

  if (matches != undefined) {
    return +matches[1];
  }
}

function tierSetLookup(pclass, spec, name, cell, slot) {
  var matches = name.match(/.*[tT](\d+).*/);
  if (matches != undefined) {
    var foundTierTokenSets = constants.tierTokens[matches[1]];
    var classTokenSet = foundTierTokenSets.find((s) =>
      s.class.includes(pclass)
    );

    var foundTierSets = constants.tierSets[matches[1]];
    var classTiers = foundTierSets.find((cs) => cs.class == pclass);

    var specSet =
      spec == "all"
        ? classTiers.sets[0]
        : classTiers.sets.find((ct) => ct.spec.includes(spec));

    var result = [specSet.items[slot], classTokenSet.tokens[slot]];

    if (result.includes(undefined)) {
      debugger;
    }

    return result;
  }
}

async function wowheadLookup(pclass, spec, name, cell, slot) {
  try {
    const response = await fetch(
      `https://tbc.wowhead.com/search/suggestions-template?q=${name}`
    );
    const whResponse = await response.json();
    var itemResult = whResponse.results.find((r) => r.type == 3);

    if (itemResult) {
      return [itemResult.id]
    }
  } catch (error) {
    debugger;
  }
}

function hardcodedLookup(pclass, spec, name, cell, slot) {
  return constants.hardcodedItems[name];
}

function sunmoteBaseItemLookup(pclass, spec, ids, cell, slot) {
  for (var id of ids){
    if (constants.sunmoteItemCombinations[id] != undefined) {
      return [constants.sunmoteItemCombinations[id]]
    }
  }
}

function verdantSphereItemLookup(pclass, spec, ids, cell, slot) {
  for (var id of ids){
    if (constants.verdantSphereRewards[id] != undefined) {
      return [constants.verdantSphere]
    }
  }
}

function magtheridonsHeadItemLookup(pclass, spec, ids, cell, slot) {
  for (var id of ids){
    if (constants.magtheridonsHeadRewards[id] != undefined) {
      return [constants.magtheridonsHead];
    }
  }
}

var itemLookupStrategies = [
  hardcodedLookup,
  tierSetLookup,
  linkLookup,
  wowheadLookup,
];

var postItemLookupStrategies = [
  sunmoteBaseItemLookup,
  verdantSphereItemLookup,
  magtheridonsHeadItemLookup,
];

module.exports = {
  itemLookupStrategies,
  postItemLookupStrategies,
};
