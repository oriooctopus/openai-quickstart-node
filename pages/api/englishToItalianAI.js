import AnkiExport from "anki-apkg-export";
import { Configuration, OpenAIApi } from "openai";
import { words as frequencyList } from "/Users/oliverullman/coding/language/openai-quickstart-node/OldDeck/frequencyList.json";
import fs from "fs";

const startIndex = 28;
const numberPerRequest = 15;
const iterations = 4;

const cardRange = `${startIndex * numberPerRequest}-${
  (startIndex + iterations) * numberPerRequest
}`;

console.log("frequencyList", frequencyList);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const apkgItalianToEnglish = new AnkiExport("_Italian-English GPT");
const apkgEnglishToItalian = new AnkiExport("_English-Italian GPT");

const addWordsFromResponse = (wordsToAdd, originalResponse) => {
  console.log("original response", originalResponse);
  const formattedResponse = originalResponse
    .split("NEW WORD")
    .filter((str) => Boolean(str));

  formattedResponse.forEach((definition, index) => {
    console.log("adding card", wordsToAdd[index], definition || "");
    const shortEnglishDefinition = definition
      .split("(")[0]
      .replace("<b>", "")
      .replace("</b>", "")
      .replace("-", "")
      .trim();
    apkgItalianToEnglish.addCard(wordsToAdd[index], definition || "");
    apkgEnglishToItalian.addCard(shortEnglishDefinition, wordsToAdd[index]);

    if (!definition) {
      console.log("no definition for", wordsToAdd[index]);
    }
  });
};

const generateFileFromResponse = () => {
  apkgItalianToEnglish
    .save()
    .then((zip) => {
      fs.writeFileSync(
        `/Users/oliverullman/coding/language/openai-quickstart-node/output/ItalianToEnglish-${cardRange}.apkg`,
        zip,
        "binary"
      );
      console.log(`Package has been generated: output.pkg`);
    })
    .catch((err) => console.log(err.stack || err));
  // apkgEnglishToItalian
  //   .save()
  //   .then((zip) => {
  //     fs.writeFileSync(
  //       `/Users/oliverullman/coding/language/openai-quickstart-node/output/EnglishToItalian-${cardRange}.apkg`,
  //       zip,
  //       "binary"
  //     );
  //     console.log(`Package has been generated: output.pkg`);
  //   })
  //   .catch((err) => console.log(err.stack || err));
};

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }

  const text = req.body.text || "";
  if (text.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid text",
      },
    });
    return;
  }

  let responseText = "";

  try {
    fs.writeFile(
      "./textResponse.txt",
      "yoyo",
      {
        encoding: "utf8",
        flag: "w",
        mode: 0o666,
      },
      (err) => {
        if (err) console.log(err);
        else {
          console.log("File written successfully\n");
          console.log("The written has the following contents:");
          console.log(fs.readFileSync("./textResponse.txt", "utf8"));
        }
      }
    );
    for (let i = startIndex; i < startIndex + iterations; i++) {
      const start = i * numberPerRequest;
      const end = (i + 1) * numberPerRequest;
      const wordsToUse = frequencyList.slice(start, end);
      console.log("words to use", wordsToUse);
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: generatePrompt(wordsToUse),
        temperature: 0.1,
        max_tokens: 2800,
      });
      // console.log("completion!!", completion.data);
      const response = completion.data.choices[0].text;
      responseText += "next one!" + response;
      addWordsFromResponse(wordsToUse, response);
    }
    generateFileFromResponse();
    fs.writeFile(
      "./textResponse.txt",
      responseText,
      {
        encoding: "utf8",
        flag: "w",
        mode: 0o666,
      },
      (err) => {
        if (err) console.log(err);
        else {
          console.log("File written successfully\n");
          console.log("The written has the following contents:");
        }
      }
    );
    res.status(200).json({ result: "done" });
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    console.log();
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}

function generatePrompt(words) {
  return 'Translate the following words from italian to english: `dopo, secondo, alcuno`. The translation should be short but not too short. Separate each translation into an array entry. For example: if the input is `intero, cercare` the response would be ["whole, entire, complete", "to search", ]`
}
