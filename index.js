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
const findMostUniqueLetterPosition = words => {
  if (words.length < 2) return [];

  const minLength = Math.min(...words.map(w => w.length));
  let bestPos = -1;
  let maxUniqueLetters = -1;

  for (let i = 0; i < minLength; i++) {
    const seen = new Set();
    for (const word of words) {
      seen.add(word[i]);
    }

    if (seen.size > maxUniqueLetters) {
      maxUniqueLetters = seen.size;
      bestPos = i;
    }
  }

  return [bestPos + 1]; // convert to 1-based indexing
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
    result.best_position = findMostUniqueLetterPosition(matches);
  }

  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
