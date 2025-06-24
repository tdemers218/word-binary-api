const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

// Vowel check
const isVowel = c => "aeiouy".includes(c);

// Binary conversion
const toBinary = w => w.split('').map(c => isVowel(c) ? '1' : '0').join('');

// Load pre-coded dictionary by language
const loadDictionary = lang => {
  const path = lang === 'fr' ? 'dictionary-fr-coded.json' : 'dictionary-coded.json';
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
};

// Analyze binary codes for most differing letter position(s)
const findMostDifferentPositions = codes => {
  if (codes.length < 2) return [];
  const length = codes[0].length;
  const counts = Array.from({ length }, () => ({ '0': 0, '1': 0 }));

  for (const code of codes) {
    for (let i = 0; i < length; i++) {
      const bit = code[i];
      counts[i][bit] = (counts[i][bit] || 0) + 1;
    }
  }

  const maxDisagreements = Math.max(...counts.map(c => Math.min(c['0'] || 0, c['1'] || 0)));
  return counts
    .map((c, i) => ({ i, disagreement: Math.min(c['0'] || 0, c['1'] || 0) }))
    .filter(c => c.disagreement === maxDisagreements)
    .map(c => c.i);
};

app.post('/api/convert', (req, res) => {
  let { words, code, lang } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing 'code'" });
  }

  let data;

  if (words) {
    // Normalize and remove accents
    words = words.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const wordList = [...new Set(words.match(/[a-z]+/g) || [])];

    data = wordList.map(word => {
      const binary = toBinary(word);
      const opposite = binary.split('').map(b => b === '1' ? '0' : '1').join('');
      return { word, code: binary, opposite };
    });
  } else {
    data = loadDictionary(lang);
  }

  const matched = data.filter(entry => entry.code === code || entry.opposite === code);
  const matches = matched.map(e => e.word);
  const matchCodes = matched.map(e => e.code);

  const result = { matches, count: matches.length };

  if (matches.length > 1) {
    result.different_positions = findMostDifferentPositions(matchCodes);
  }

  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
