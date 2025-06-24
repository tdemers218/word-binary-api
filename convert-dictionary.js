const fs = require("fs");

const isVowel = c => "aeiouy".includes(c.toLowerCase());
const toBinary = w => w.toLowerCase().split('').map(c => isVowel(c) ? '1' : '0').join('');

const raw = fs.readFileSync("dictionary-fr.json", "utf-8");
const words = JSON.parse(raw);

const data = words.map(word => {
  const code = toBinary(word);
  const opposite = code.split('').map(b => b === '1' ? '0' : '1').join('');
  return { word, code, opposite };
});

fs.writeFileSync("dictionary-coded-fr.json", JSON.stringify(data, null, 2));
console.log("✅ dictionary-coded.json written with", data.length, "words.");
