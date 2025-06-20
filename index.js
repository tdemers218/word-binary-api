const express = require('express');
const app = express();

app.use(express.json());

const isVowel = (char) => 'aeiou'.includes(char);

const toBinary = (word) => {
    return word.split('').map(c => isVowel(c) ? '1' : '0').join('');
};

app.post('/api/convert', (req, res) => {
    let { words, code } = req.body;

    if (!words || !code) {
        return res.status(400).json({ error: "Missing 'words' or 'code'" });
    }

    // Normalize input
    words = words.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const wordList = [...new Set(words.match(/[a-z]+/g) || [])];

    const data = wordList.map(word => {
        const binary = toBinary(word);
        const opposite = binary.split('').map(b => b === '1' ? '0' : '1').join('');
        return { word, code: binary, opposite };
    });

    const matches = data.filter(entry => entry.code === code || entry.opposite === code).map(e => e.word);

    res.json({ data, matches });
});

// Local testing
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
