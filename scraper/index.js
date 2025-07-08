const fs = require("bun:fs");
const luamin = require("luamin");
const classList = require("./classes.json");

var { Liquid } = require("liquidjs");
var engine = new Liquid();

const itemsDb = JSON.parse(fs.readFileSync("item_db.json"));

var metadata = {};

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
	[11]: "Inscription",
};

const phases = ["Pre-Bis", "T14" /*"T15", "T16"*/];

const itemDependencyMap = {
	//[1234]: [1234,1235]
};

const itemSets = {
	T14: [
		1131, 1143, 1129, 1133, 1123, 1135, 1139, 1141, 1130, 1144, 1132, 1126,
		1128, 1125, 1136, 1124, 1138, 1145, 1137, 1140, 1134, 1127, 1142,
	],
};

const slotNameToIdMap = {
	helm: [1],
	shoulders: [3],
	chest: [5, 20],
	gauntlets: [7],
	leggings: [10],
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
	ranged: "ranged",
};

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
			`https://wowtbc.gg/page-data/mop/bis-list/${listName}/page-data.json`,
		);

		let bisList;
		try {
			bisList = await bisListRequest.json();
		} catch (e) {
			debugger;
			continue;
		}

		const data = bisList.result.pageContext;
		const bisData = data.bisList;

		for (const phase of phases) {
			const phaseIndex = phases.indexOf(phase);
			const className = classs.replace(" ", "");
			if (!result[phaseIndex][className]) {
				result[phaseIndex][className] = {
					class: className,
					specs: [],
				};
			}

			if (!result[phaseIndex][className].specs) {
				result[phaseIndex][className].specs = [];
			}

			const currentSpec = {
				class: className,
				spec: spec,
				role: role,
				items: {},
			};

			for (const slot of Object.keys(wowtbcGGMap)) {
				const filteredItems = bisData.filter(
					(i) => i.slot === slot && i.phase.includes(phase),
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

				if (!wowtbcGGMap[slot]) {
					debugger;
				}

				if (wowtbcGGMap[slot] && itemsOrdered.length > 0) {
					currentSpec.items[wowtbcGGMap[slot]] = itemsOrdered.map((item) => {
						const foundItems = data.gearData.filter(
							(i) => i.name === item.name,
						);

						if (!foundItems.length === 0) {
							debugger;
						}

						if (!foundItems.length > 1) {
							debugger;
						}

						const itemData = foundItems[0];
						const additionalData = item[phase.toLowerCase()];

						let gems = additionalData.gems?.map(
							(x) =>
								itemsDb.filter((g) => g.name === x.name && g.class !== 9)?.[0]
									?.id, // TODO: get id for gems
						);

						if (gems?.length === 0) {
							gems = undefined;
						}

						const enchant = itemsDb?.filter(
							(g) => g.name === additionalData.enchant?.name && g.class !== 9,
						)?.[0]?.id;

						return {
							id: itemData.id,
							name: itemData.name,
							source: `${item.source} - ${item.source_type}`,
							enchant: enchant,
							gems: gems,
							reforge: [],
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
		const phaseIndex = phases.indexOf(phase);

		const wowtbcDataPath = `phase_${phaseIndex}.json`;
		if (!fs.existsSync(wowtbcDataPath)) continue;

		const path = fs.readFileSync(wowtbcDataPath);
		const data = JSON.parse(path);

		for (const classDef of Object.values(data)) {
			const className = classDef.class;
			result[phaseIndex][className] = {
				class: className,
				specs: [],
			};

			for (const specDef of classDef.specs) {
				const currentSpec = {
					class: className,
					spec: specDef.spec,
					role: specDef.role,
					items: {},
				};

				console.log(currentSpec);

				for (const itemSlot of Object.entries(specDef.items)) {
					const slotName = itemSlot[0];
					currentSpec.items[slotName] = [];
					for (const itemObj of itemSlot[1]) {
						currentSpec.items[slotName].push({
							id: itemObj.id,
							gems: itemObj.gems?.length > 0 ? itemObj.gems : null,
							enchant: itemObj.enchant,
							dependencies:
								itemObj.dependencies?.length > 0 ? itemObj.dependencies : null,
						});
						metadata[itemObj.id] = itemObj.source;

						const recipe = itemsDb.find(
							(i) => i.name.includes(itemObj.name) && i.class === 9,
						);
						if (recipe) {
							itemDependencyMap[recipe.id] = [itemObj.id];
							metadata[recipe.id] = recipeSubclass[recipe.subclass];
						}
					}
				}

				for (const entry of Object.entries(currentSpec.items)) {
					const items = entry[1];
					for (const itemEntry of items) {
						for (const itemDependencyEntry of Object.entries(
							itemDependencyMap,
						)) {
							for (const depItem of itemDependencyEntry[1]) {
								if (depItem === itemEntry.id) {
									if (!itemEntry.dependencies) {
										itemEntry.dependencies = [];
									}
									itemEntry.dependencies.push(+itemDependencyEntry[0]);
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
	for (let i = 0; i < max; i++) {
		if (first[i] && result.findIndex((ig) => ig.id === first[i].id) === -1) {
			result.push(first[i]);
		}
		if (second[i] && result.findIndex((ig) => ig.id === second[i].id) === -1) {
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
			`phase_${phase[0]}.json`,
			JSON.stringify(phase[1], null, 2),
		);
	}
	return await processPhasesWowTBCGG();
}

function fillItemSetDependencies() {
	for (const phase of Object.keys(itemSets)) {
		const sets = itemSets[phase];
		// itemsDb.find(x=> x.itemSet)
		const itemsGroupedByIlvl = Object.groupBy(
			itemsDb.filter((i) => sets.includes(i.itemSet)),
			({ ilvl }) => ilvl,
		);
		const ilvls = Object.keys(itemsGroupedByIlvl).map((i) => +i);
		const tokensGroupedByIlvl = Object.groupBy(
			itemsDb.filter(
				(i) =>
					i.class === 15 &&
					i.subclass === 0 &&
					i.quality === 4 &&
					ilvls.includes(i.ilvl),
			),
			({ ilvl }) => ilvl,
		);

		for (const ilvl of ilvls) {
			// [token] = [item1,item2,item3]
			const tokens = tokensGroupedByIlvl[ilvl];
			const items = itemsGroupedByIlvl[ilvl];
			for (const token of tokens) {
				const slotName = token.name.split(" ")[0].toLocaleLowerCase();
				const slotIds = slotNameToIdMap[slotName];

				if (!slotIds) {
					debugger;
				}

				const itemsForToken = items.filter(
					(i) =>
						i.class === 4 &&
						slotIds.includes(i.slot) &&
						token.allowableClass & i.allowableClass,
				);
				itemDependencyMap[token.id] = itemsForToken.map((i) => i.id);
			}
		}
	}
}

async function main() {
	fillItemSetDependencies();
	const now = new Date();
	const bisListTemplate = fs.readFileSync("bisListTemplate.liquid", "utf8");
	const metadataTemplate = fs.readFileSync("metadataTemplate.liquid", "utf8");
	const bisAddonData = {
		version: `${now.getFullYear()}${
			now.getMonth() + 1
		}${now.getDate()}${now.getHours()}${now.getMinutes()}`,
		phases: {},
	};

	bisAddonData.phases = await getWowTBCData();

	const bisListRender = await engine.parseAndRender(
		bisListTemplate,
		bisAddonData,
	);
	fs.writeFileSync("/addondata/bis_list.lua", luamin.minify(bisListRender));

	const metadataRender = await engine.parseAndRender(metadataTemplate, {
		metadata,
	});
	fs.writeFileSync("/addondata/metadata.lua", luamin.minify(metadataRender));

	console.log("done");
}

main();
