const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/convert', (req, res) => {
  let { words, code } = req.body;

  if (!words || !code) {
    return res.status(400).json({ error: "Missing 'words' or 'code'" });
  }

  // Normalize + remove accents
  words = words.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const wordList = [...new Set(words.match(/[a-z]+/g) || [])];

  const isVowel = c => "aeiou".includes(c);
  const toBinary = w => w.split('').map(c => isVowel(c) ? '1' : '0').join('');

  const data = wordList.map(word => {
    const binary = toBinary(word);
    const opposite = binary.split('').map(b => b === '1' ? '0' : '1').join('');
    return { word, code: binary, opposite };
  });

  const matches = data.filter(entry => entry.code === code || entry.opposite === code).map(e => e.word);

  res.json({ matches });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
