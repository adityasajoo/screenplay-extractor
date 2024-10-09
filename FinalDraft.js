// finalDraft.js
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

class FinalDraft {
    constructor(filename) {
        this.filename = filename;
        this.content = [];
    }

    parseFile(callback) {
        fs.readFile(this.filename, 'utf8', (err, data) => {
            if (err) {
                return callback(err);
            }

            try {
                const parser = new XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: '',
                    textNodeName: 'text',
                    allowBooleanAttributes: true,
                    parseAttributeValue: true,
                    parseTagValue: true,
                });
                const result = parser.parse(data);
                this.processXML(result);
                callback(null, this.content);
            } catch (parseErr) {
                callback(parseErr);
            }
        });
    }

    processXML(xmlData) {
        const paragraphs = xmlData.FinalDraft.Content.Paragraph || [];

        paragraphs.forEach(paragraph => {
            const type = paragraph.Type;
            let text = '';

            if (paragraph.Text) {
                const texts = Array.isArray(paragraph.Text) ? paragraph.Text : [paragraph.Text];
                texts.forEach(textElement => {
                    text += this.extractText(textElement);
                });
            }

            this.content.push({ type: type, text: text });
        });
    }

    // Helper method to extract text recursively
    extractText(element) {
        if (typeof element === 'string') {
            return element;
        } else if (element.text) {
            return element.text;
        } else {
            let result = '';
            for (const key in element) {
                if (Array.isArray(element[key])) {
                    element[key].forEach(subElement => {
                        result += this.extractText(subElement);
                    });
                } else if (typeof element[key] === 'object') {
                    result += this.extractText(element[key]);
                }
            }
            return result;
        }
    }
}

module.exports = FinalDraft;
