import clipboard from 'clipboardy';

var input = ``;

var itemOrder = [
  "HEAD",
  "NECK",
  "SHOULDERS",
  "BACK",
  "CHEST",
  "WRISTS",
  "MAIN_HAND",
  "OFF_HAND",
  "TWO_HAND",
  "HANDS",
  "WAIST",
  "LEGS",
  "FEET",
  "FINGER_1",
  "FINGER_2",
  "TRINKET_1",
  "TRINKET_2",
  "RANGED",
];

var json = JSON.parse(input);

var result = "";

itemOrder.forEach((slot) => {
  var slotToLookup = slot;

  if (slotToLookup == "TWO_HAND") slotToLookup = "MAIN_HAND";

  var found = json.items.find((item) => item.slot == slot);

  if (
    slot == "MAIN_HAND" && slotToLookup == "slotToLookup" &&
    json.items.find((item) => item.slot == "OFF_HAND")
  ) {
    result += "N/A\t";
  }

  console.log(found);

  if (found) {
    result += found.name;
  } else {
    result += "N/A";
  }
  result += "\t";
});

clipboard.writeSync(result);