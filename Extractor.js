// Extractor.js
const FinalDraft = require('./finalDraft');

class Extractor {
    constructor(filename) {
        this.filename = filename;
        this.metadata = {};
        this.content = [];
    }

    /**
     * Parses the .fdx file and stores the metadata and content.
     * @param {Function} callback - The callback function(err, parsedData).
     */
    parseFile(callback) {
        const parser = new FinalDraft(this.filename);
        parser.parseFile((err, parsedData) => {
            if (err) {
                return callback(err);
            }
            this.metadata = parsedData.metadata;
            this.content = parsedData.content;
            callback(null, { metadata: this.metadata, content: this.content });
        });
    }
}

module.exports = Extractor;
