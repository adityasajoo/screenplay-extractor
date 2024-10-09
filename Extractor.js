// Extractor.js
const FinalDraft = require('./finalDraft');

class Extractor {
    constructor(filename) {
        this.filename = filename;
        this.content = [];
    }

    parseFile(callback) {
        const parser = new FinalDraft(this.filename);
        parser.parseFile((err, content) => {
            if (err) {
                return callback(err);
            }
            this.content = content;
            callback(null, content);
        });
    }
}

module.exports = Extractor;
