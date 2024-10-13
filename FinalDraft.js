// finalDraft.js
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

class FinalDraft {
    constructor(filename) {
        this.filename = filename;
        this.metadata = {};
        this.content = [];
    }

    /**
     * Parses the .fdx file and extracts metadata and content.
     * @param {Function} callback - The callback function(err, parsedData).
     */
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
                // Return both metadata and content
                callback(null, { metadata: this.metadata, content: this.content });
            } catch (parseErr) {
                callback(parseErr);
            }
        });
    }

    /**
     * Processes the parsed XML data to extract metadata and content.
     * @param {Object} xmlData - The parsed XML data.
     */
    processXML(xmlData) {
        // Extract Metadata from TitlePage
        const titlePageContent = xmlData.FinalDraft.TitlePage.Content;
        if (titlePageContent && titlePageContent.Paragraph) {
            const paragraphs = Array.isArray(titlePageContent.Paragraph)
                ? titlePageContent.Paragraph
                : [titlePageContent.Paragraph];
            
            let writtenByFound = false;

            paragraphs.forEach((paragraph, index) => {
                const textContent = this.extractText(paragraph.Text).trim();

                // Extract Title
                if (paragraph.Text && paragraph.Text.Style === 'AllCaps' && textContent.length > 0) {
                    this.metadata['Title'] = textContent;
                }

                // Extract Author
                if (writtenByFound && textContent.length > 0 && !this.metadata['Author']) {
                    this.metadata['Author'] = textContent;
                    writtenByFound = false; // Reset after finding the author
                }

                if (textContent.toLowerCase() === 'written by') {
                    writtenByFound = true;
                }
            });
        }

        // Assign default values if metadata not found
        if (!this.metadata['Title']) {
            this.metadata['Title'] = 'Unknown Title';
        }
        if (!this.metadata['Author']) {
            this.metadata['Author'] = 'Unknown Author';
        }

        // Extract Content from Content (Script)
        const scriptContent = xmlData.FinalDraft.Content.Paragraph || [];

        const scriptParagraphs = Array.isArray(scriptContent) ? scriptContent : [scriptContent];

        scriptParagraphs.forEach(paragraph => {
            const type = paragraph.Type || 'Unknown';
            const text = this.extractText(paragraph.Text).trim();

            if (text.length > 0) {
                if (type === 'Dual Dialogue') {
                    // Handle Dual Dialogue
                    const dualDialogue = this.parseDualDialogue(paragraph);
                    if (dualDialogue) {
                        this.content.push(dualDialogue);
                    }
                } else {
                    // Handle Regular Paragraphs
                    this.content.push({ type: type, text: text });
                }
            }
        });
    }

    /**
     * Parses a Dual Dialogue paragraph and returns a structured object.
     * @param {Object} paragraph - The Paragraph object representing Dual Dialogue.
     * @returns {Object|null} - Structured Dual Dialogue object or null if parsing fails.
     */
    parseDualDialogue(paragraph) {
        try {
            const texts = Array.isArray(paragraph.Text) ? paragraph.Text : [paragraph.Text];
            
            if (texts.length < 4) {
                // Assuming at least two character names and two dialogue lines
                console.warn('Dual Dialogue paragraph does not have enough Text elements.');
                return null;
            }

            // Initialize arrays to hold character names and dialogues
            const characters = [];
            const dialogues = [];

            // Extract Character Names
            for (let i = 0; i < 2; i++) {
                const charName = this.extractText(texts[i]).trim() || 'Unknown';
                characters.push(charName);
            }

            // Extract Dialogue Lines
            for (let i = 2; i < texts.length; i++) {
                const dialogue = this.extractText(texts[i]).trim();
                dialogues.push(dialogue);
            }

            return {
                type: 'Dual Dialogue',
                characters: characters,
                dialogues: dialogues
            };
        } catch (error) {
            console.error('Error parsing Dual Dialogue:', error);
            return null;
        }
    }

    /**
     * Helper method to extract text recursively from an element.
     * @param {Object|string} element - The Text element or string.
     * @returns {string} - The extracted text.
     */
    extractText(element) {
        if (!element) {
            return '';
        }
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
