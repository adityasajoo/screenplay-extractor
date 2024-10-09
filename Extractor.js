const path = require('path');
const fs = require('fs').promises;
const FinalDraft = require('./Filters/FinalDraft'); // Using the previously created FinalDraft.js

class Extractor {
  /**
   * Constructor that initializes the Extractor.
   * 
   * @param {string} filePath - The full system path to the file to be parsed.
   * @throws Will throw an error if the file does not exist or is not readable, or if the file extension is not allowed.
   */
  constructor(filePath = null) {
    if (filePath && fs.access(filePath)) {
      this.allowedExts = ['fdx']; // Only FinalDraft supported

      const fileParts = path.parse(filePath);
      this.directory = fileParts.dir;
      this.filename = fileParts.base;
      this.extension = fileParts.ext.replace('.', ''); // Remove leading dot
      this.fileBase = fileParts.name;

      if (this.allowedExts.includes(this.extension.toLowerCase())) {
        try {
          this.screenplay = this.loadFilter(this.extension, filePath);
        } catch (error) {
          console.error('Error while loading filter:', error);
        }
      } else {
        throw new Error(`File extension ${this.extension} is not allowed.`);
      }
    } else {
      throw new Error(`File ${filePath} does not exist or is not readable.`);
    }
  }

  /**
   * Load the FinalDraft filter based on the file extension.
   * 
   * @param {string} extension - The file extension (only 'fdx' is supported).
   * @param {string} filePath - The full system path to the file.
   * @returns {Object} The FinalDraft filter object.
   */
  loadFilter(extension, filePath) {
    return new FinalDraft(filePath); // Only FinalDraft is used
  }

  /**
   * Accessor for getting the parsed data.
   * 
   * @returns {Object|boolean} The parsed data from FinalDraft or false.
   */
  analyzer() {
    return this.screenplay;
  }
}

module.exports = Extractor;
