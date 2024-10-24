// index.js
const fs = require('fs');
const Extractor = require('./Extractor');

const filename = 'test.pdf'; // Change this to your PDF filename
const outputFilename = 'parsed_content.json';

const extractor = new Extractor(filename);

extractor.parseFile((err, parsedData) => {
    if (err) {
        console.error('Error parsing file:', err);
    } else {
        // Write the metadata and content to a JSON file
        fs.writeFile(outputFilename, JSON.stringify(parsedData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing to file:', writeErr);
            } else {
                console.log('Parsed content successfully saved to', outputFilename);
            }
        });

        // Additionally, log the metadata and content separately if needed
        console.log('Metadata:', parsedData.metadata);
        console.log('Content:', parsedData.content);

        // Optional: Pretty-print Dual Dialogues in the console
        parsedData.content.forEach(item => {
            if (item.type === 'Dual Dialogue') {
                console.log('Dual Dialogue:');
                item.characters.forEach((char, idx) => {
                    console.log(`  ${char}: ${item.dialogues[idx]}`);
                });
            } else {
                console.log(`${item.type}: ${item.text}`);
            }
        });
    }
});
