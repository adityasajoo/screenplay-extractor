// index.js
const fs = require('fs');
const Extractor = require('./Extractor');

const filename = 'test.fdx';
const outputFilename = 'parsed_content.json';

const extractor = new Extractor(filename);

extractor.parseFile((err, content) => {
    if (err) {
        console.error('Error parsing file:', err);
    } else {
        // Write the content to a JSON file
        fs.writeFile(outputFilename, JSON.stringify(content, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing to file:', writeErr);
            } else {
                console.log('Parsed content successfully saved to', outputFilename);
            }
        });
    }
});
