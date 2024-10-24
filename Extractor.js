// Extractor.js
const path = require('path');
const FinalDraft = require('./finalDraft');
const PDFParser = require('./pdfParser');

class Extractor {
    constructor(filename) {
        this.filename = filename;
        this.metadata = {};
        this.content = [];
    }

    /**
     * Parses the file (.fdx or .pdf) and stores the metadata and content.
     * @param {Function} callback - The callback function(err, parsedData).
     */
    parseFile(callback) {
        const ext = path.extname(this.filename).toLowerCase();
        if (ext === '.fdx') {
            const parser = new FinalDraft(this.filename);
            parser.parseFile((err, parsedData) => {
                if (err) {
                    return callback(err);
                }
                this.metadata = parsedData.metadata;
                this.content = parsedData.content;
                callback(null, { metadata: this.metadata, content: this.content });
            });
        } else if (ext === '.pdf') {
            const parser = new PDFParser(this.filename);
            parser.parseFile((err, parsedData) => {
                if (err) {
                    return callback(err);
                }
                this.metadata = parsedData.metadata;
                this.content = parsedData.content;
                callback(null, { metadata: this.metadata, content: this.content });
            });
        } else {
            callback(new Error('Unsupported file type.'));
        }
    }
}

module.exports = Extractor;
