const Extractor = require('./Extractor');
const fs = require('fs').promises;

async function runParser() {
  const filePath = './test.fdx'; // Your test file

  try {
    // Initialize the Extractor with the file path
    const parser = new Extractor(filePath);

    // Load the FinalDraft filter and parse the file
    await parser.screenplay.loadFile();

    // Parse characters, scenes, and capitalized words
    const characters = parser.screenplay.parseCharacters();
    const scenes = parser.screenplay.parseScenes();
    const capitalizedItems = parser.screenplay.parseCapitalized();

    // Log the data
    console.log('Characters:', characters);
    console.log('Scenes:', scenes);
    console.log('Capitalized Items:', capitalizedItems);

    // Create a JSON object from the parsed data
    const parsedData = {
      characters,
      scenes,
      capitalizedItems
    };

    // Convert the data to JSON string
    const jsonString = JSON.stringify(parsedData, null, 2); // `null, 2` makes the JSON pretty-printed

    // Write the JSON data to a file
    await fs.writeFile('./parsedScreenplay.json', jsonString);

    console.log('Parsed data saved to parsedScreenplay.json');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the parser
runParser();
