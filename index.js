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
const findMostInformativePosition = words => {
  if (words.length < 2) return [];

  const length = Math.min(...words.map(w => w.length));
  let bestPosition = -1;
  let bestScore = Infinity;

  for (let i = 0; i < length; i++) {
    const counts = {};

    // Count frequency of each letter at position i
    for (const word of words) {
      const letter = word[i];
      counts[letter] = (counts[letter] || 0) + 1;
    }

    // Compute expected size of remaining group if we knew this letter
    const total = words.length;
    const expectedSize = Object.values(counts)
      .map(count => (count / total) * count)  // probability * group size
      .reduce((sum, val) => sum + val, 0);

    if (expectedSize < bestScore) {
      bestScore = expectedSize;
      bestPosition = i;
    }
  }

  return [bestPosition];
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
    result.best_position = findMostInformativePosition(matches);
  }

  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
