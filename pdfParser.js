// pdfParser.js
const fs = require('fs');
const pdf = require('pdf-parse');

class PDFParser {
    constructor(filename) {
        this.filename = filename;
        this.metadata = {};
        this.content = [];
    }

    /**
     * Parses the PDF file and extracts metadata and content.
     * @param {Function} callback - The callback function(err, parsedData).
     */
    parseFile(callback) {
        const dataBuffer = fs.readFileSync(this.filename);

        pdf(dataBuffer).then(data => {
            try {
                this.processText(data.text);
                callback(null, { metadata: this.metadata, content: this.content });
            } catch (err) {
                callback(err);
            }
        }).catch(err => {
            callback(err);
        });
    }

    /**
     * Processes the extracted text to extract metadata and content.
     * @param {string} text - The text extracted from the PDF.
     */
    processText(text) {
        // Split text into lines
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Extract Metadata (Title and Author)
        this.extractMetadata(lines);

        // Extract Content
        this.extractContent(lines);
    }

    /**
     * Extracts metadata (Title and Author) from the text lines.
     * @param {Array} lines - Array of text lines.
     */
    extractMetadata(lines) {
        // Define known elements to exclude from title and author detection
        const knownElements = [
            'CUT TO:',
            'FADE IN:',
            'FADE OUT:',
            'CREDITS START.',
            'CREDITS END.',
            'DISSOLVE TO:',
            'SMASH CUT TO:',
            'INT.',
            'EXT.',
            'INT/EXT.',
            'DAY',
            'NIGHT',
            'MORNING',
            'EVENING',
            'LATER',
        ];
        const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.)/i;
        const transitionRegex = /^(CUT TO:|FADE IN:|FADE OUT:|DISSOLVE TO:|SMASH CUT TO:)/i;

        // Attempt to extract Title from the first few lines
        let titleCandidate = null;
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const line = lines[i];
            if (
                line.length > 0 &&
                line === line.toUpperCase() &&
                !knownElements.includes(line) &&
                !sceneHeadingRegex.test(line) &&
                !transitionRegex.test(line) &&
                !/^\d+/.test(line)
            ) {
                titleCandidate = line;
                break;
            }
        }
        if (titleCandidate) {
            this.metadata['Title'] = titleCandidate;
        }

        // Attempt to extract Author
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.toLowerCase() === 'written by' || line.toLowerCase() === 'by') {
                // The next non-empty, valid line is considered the author
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j];
                    if (
                        nextLine.length > 0 &&
                        !knownElements.includes(nextLine) &&
                        !sceneHeadingRegex.test(nextLine) &&
                        !transitionRegex.test(nextLine) &&
                        !/^\d+/.test(nextLine)
                    ) {
                        this.metadata['Author'] = nextLine;
                        return;
                    }
                }
            }
        }

        // Assign default values if metadata not found
        if (!this.metadata['Title']) {
            this.metadata['Title'] = 'Unknown Title';
        }
        if (!this.metadata['Author']) {
            this.metadata['Author'] = 'Unknown Author';
        }
    }

    /**
     * Extracts content from the text lines.
     * @param {Array} lines - Array of text lines.
     */
    extractContent(lines) {
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            // Skip over the metadata lines at the top
            if (i < 5 && (line.toLowerCase() === 'written by' || line.toLowerCase() === 'by' || line === this.metadata['Title'])) {
                i++;
                continue;
            }

            // Detect Scene Headings
            if (this.isSceneHeading(line)) {
                this.content.push({ type: 'Scene Heading', text: line });
                i++;
            }
            // Detect Dual Dialogue
            else if (this.isDualDialogue(lines, i)) {
                const dualDialogue = this.parseDualDialogue(lines, i);
                this.content.push({
                    type: 'Dual Dialogue',
                    characters: dualDialogue.characters,
                    dialogues: dualDialogue.dialogues
                });
                i = dualDialogue.nextIndex;
            }
            // Detect Character Names
            else if (this.isCharacterName(line)) {
                const character = line;
                i++;

                // Check for possible parenthetical
                let parenthetical = '';
                if (i < lines.length && this.isParenthetical(lines[i])) {
                    parenthetical = lines[i];
                    i++;
                }

                // Collect Dialogue lines
                let dialogue = '';
                while (i < lines.length && this.isDialogue(lines[i])) {
                    dialogue += lines[i] + ' ';
                    i++;
                }

                if (parenthetical) {
                    this.content.push({ type: 'Parenthetical', text: parenthetical });
                }

                this.content.push({ type: 'Character', text: character });
                this.content.push({ type: 'Dialogue', text: dialogue.trim() });
            }
            // Action lines
            else {
                let action = line;
                i++;
                while (i < lines.length && !this.isSceneHeading(lines[i]) && !this.isCharacterName(lines[i])) {
                    action += ' ' + lines[i];
                    i++;
                }
                this.content.push({ type: 'Action', text: action.trim() });
            }
        }
    }

    isSceneHeading(line) {
        return /^(INT\.|EXT\.|INT\/EXT\.)/i.test(line);
    }

    isCharacterName(line) {
        return /^[A-Z\s\-()']+$/.test(line) && line === line.toUpperCase() && line.length <= 30;
    }

    isParenthetical(line) {
        return /^\(.*\)$/.test(line);
    }

    isDialogue(line) {
        return line.length > 0 && !this.isSceneHeading(line) && !this.isCharacterName(line) && !this.isParenthetical(line);
    }

    isDualDialogue(lines, index) {
        if (index + 2 < lines.length) {
            return this.isCharacterName(lines[index]) && this.isCharacterName(lines[index + 1]);
        }
        return false;
    }

    parseDualDialogue(lines, index) {
        const characters = [];
        const dialogues = [];
        let i = index;

        // Extract first character and dialogue
        const character1 = lines[i];
        i++;

        let dialogue1 = '';
        while (i < lines.length && this.isDialogue(lines[i])) {
            dialogue1 += lines[i] + ' ';
            i++;
        }

        // Extract second character and dialogue
        if (i < lines.length && this.isCharacterName(lines[i])) {
            const character2 = lines[i];
            i++;

            let dialogue2 = '';
            while (i < lines.length && this.isDialogue(lines[i])) {
                dialogue2 += lines[i] + ' ';
                i++;
            }

            characters.push(character1, character2);
            dialogues.push(dialogue1.trim(), dialogue2.trim());
        } else {
            // Not a dual dialogue; fallback to normal dialogue
            characters.push(character1);
            dialogues.push(dialogue1.trim());
        }

        return {
            characters: characters,
            dialogues: dialogues,
            nextIndex: i
        };
    }
}

module.exports = PDFParser;
