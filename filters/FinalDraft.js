const { DOMParser } = require('xmldom');
const fs = require('fs').promises;

class FinalDraft {
  constructor(filePath) {
    this.file = filePath;
    this.content = null;
    this.characters = [];
    this.scenes = [];
    this.uppercase = [];
    this.uppercaseRegex = /\b([A-Z0-9\s]{2,})\b/;
  }

  /**
   * Loads the file and parses it as XML using fs for local file reading.
   */
  async loadFile() {
    try {
      const fileContent = await fs.readFile(this.file, 'utf8');
      const parser = new DOMParser();
      this.content = parser.parseFromString(fileContent, 'application/xml');
    } catch (error) {
      console.error('Failed to load file: ', error);
    }
  }

  /**
   * Retrieves a list of characters from the document.
   * @returns {string[] | boolean} A list of characters, or false if unavailable.
   */
  parseCharacters() {
    if (this.content) {
      const cast = this.content.getElementsByTagName('Member');
      for (let i = 0; i < cast.length; i++) {
        const character = cast[i].getAttribute('Character');
        if (character) {
          this.characters.push(character);
        }
      }

      const paragraphs = this.content.getElementsByTagName('Paragraph');
      for (let i = 0; i < paragraphs.length; i++) {
        const type = paragraphs[i].getAttribute('Type');
        if (type === 'Character') {
          const text = paragraphs[i].textContent.trim();
          if (text && !this.characters.includes(text) && !text.includes('(')) {
            this.characters.push(text.toUpperCase());
          }
        }
      }

      this.characters.sort();
      return this.characters;
    } else {
      return false;
    }
  }

  /**
   * Retrieves a list of scenes from the document.
   * @returns {string[]} A list of scenes.
   */
  parseScenes() {
    const scenes = [];
    if (this.content) {
      const paragraphs = this.content.getElementsByTagName('Paragraph');
      for (let i = 0; i < paragraphs.length; i++) {
        const type = paragraphs[i].getAttribute('Type');
        if (type === 'Scene Heading') {
          const text = paragraphs[i].textContent.trim();
          if (text) {
            scenes.push(text);
          }
        }
      }
    }
    return scenes;
  }

  /**
   * Retrieves a list of capitalized (emphasized) items.
   * @returns {string[]} A list of capitalized words.
   */
  parseCapitalized() {
    const uppercaseItems = [];
    if (this.content) {
      const paragraphs = this.content.getElementsByTagName('Paragraph');
      for (let i = 0; i < paragraphs.length; i++) {
        const type = paragraphs[i].getAttribute('Type');
        if (type === 'Action') {
          const text = paragraphs[i].textContent.trim();
          const matches = text.match(this.uppercaseRegex);
          if (matches) {
            matches.forEach((match) => {
              const trimmedMatch = match.trim();
              if (
                trimmedMatch &&
                !this.characters.includes(trimmedMatch) &&
                !uppercaseItems.includes(trimmedMatch)
              ) {
                uppercaseItems.push(trimmedMatch);
              }
            });
          }
        }
      }
    }
    uppercaseItems.sort();
    return uppercaseItems;
  }
}

module.exports = FinalDraft;
