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
      `https://www.wowhead.com/wotlk/search/suggestions-template?q=${name}`
    );
    const whResponse = await response.json();
    var itemResult = whResponse.results.find((r) => r.type == 3);

    if (itemResult) {
      return [itemResult.id];
    }
  } catch (error) {
    debugger;
  }
}

function warglaiveLookup(pclass, spec, name, cell, slot) {
  if (name == "Warglaive of Azzinoth") {
    return [constants.warglaives[slot]];
  }
}

function hardcodedLookup(pclass, spec, name, cell, slot) {
  return constants.hardcodedItems[name];
}

function sunmoteBaseItemLookup(pclass, spec, ids, cell, slot) {
  for (var id of ids) {
    if (constants.sunmoteItemCombinations[id] != undefined) {
      return [constants.sunmoteItemCombinations[id], constants.sunmote];
    }
  }
}

function darkmoonDeckItemLookup(pclass, spec, ids, cell, slot) {
  for (var id of ids) {
    if (constants.darkmoonDecks[id] != undefined) {
      return [constants.darkmoonDecks[id]];
    }
  }
}

function verdantSphereItemLookup(pclass, spec, ids, cell, slot) {
  for (var id of ids) {
    if (constants.verdantSphereRewards.includes(id)) {
      return [constants.verdantSphere];
    }
  }
}

function magtheridonsHeadItemLookup(pclass, spec, ids, cell, slot) {
  for (var id of ids) {
    if (constants.magtheridonsHeadRewards.includes(id)) {
      return [constants.magtheridonsHead];
    }
  }
}

function tierSetReverseLookup(pclass, spec, ids, cell, slot){
  var result = [];
  for (var id of ids) {
    Object.entries(constants.tierSets).forEach(tier => {
      var tierNumber = +tier[0];
      tier[1].forEach(classSet => {
        if (classSet.class == pclass){
          classSet.sets.forEach(tierSet => {
            if (tierSet.spec.includes(spec)){
              Object.entries(tierSet.items).forEach(items => {
                if (items[1] == id){
                  constants.tierTokens[tierNumber].forEach(tokens => {
                    if (tokens.class.includes(pclass)){
                      result.push(tokens.tokens[items[0]]);
                    }
                  })
                }
              });
            }
          });
        }
      });
    });
  }

  return result;
}

var itemLookupStrategies = [
  hardcodedLookup,
  warglaiveLookup,
  tierSetLookup,
  linkLookup,
  wowheadLookup,
];

var postItemLookupStrategies = [
  sunmoteBaseItemLookup,
  verdantSphereItemLookup,
  magtheridonsHeadItemLookup,
  darkmoonDeckItemLookup,
  tierSetReverseLookup,
];

module.exports = {
  itemLookupStrategies,
  postItemLookupStrategies,
};
