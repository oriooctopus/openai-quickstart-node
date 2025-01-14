import AnkiExport from "anki-apkg-export";
import { Configuration, OpenAIApi } from "openai";
import { words as frequencyList } from "/Users/oliverullman/coding/language/openai-quickstart-node/OldDeck/frequencyList.json";
import fs from "fs";

const startIndex = 112;
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

  try {
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
      addWordsFromResponse(wordsToUse, response);
    }
    generateFileFromResponse();
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
  // return "hello";

  return `generate the backside of a flashcard for each of the following words: ${words.toString()}. These words are in spanish. Here are some examples for italian for the words essere, grande, cosi, fino, quello, and bravo:\`<b>To be</b> - (eh-seh-reh) <br />
v. Be, exist, occur, happen, become, there is, there exists, cost <br />
n. existence, condition, creature <br />
<br /><i>(m) Being existence, condition, creature</i> <br />
Example: "Essere umano" (Human being) <br />
<i>v. Be, exist, occur, happen, become, there is, there exists, cost</i> <br />
Example: "Questa mela è verde." (This apple is green.)
NEW WORD

<b> Big</b> - (grahn-deh) <br />
adj. big, large, great, high, tall <br />
<br />Example: "Una grande casa" (A big house)
NEW WORD

<b>Like this</b> - (koh-zee) <br />
adv. so, thus, in this way, as follows <br />
<br />
Example: "Così facciamo" (So let's do it)
NEW WORD

<b>Until</b> - (fee-noh) <br />
adv. until, up to, as far as, even <br />
conj. until, till <br />
<br />adv. until, up to, as far as, even <br />
Example: "Fino a quando?" (Until when?) <br />
conj. until, till <br />
Example: "Fino a quando non arriverà" (Until he arrives)
NEW WORD

<b>That</b> - (kehl-loh) <br />
pron. that, that one, that thing <br />
<br />Example: "Quello è il mio libro" (That is my book)
NEW WORD

<b>Well done!</b> - (brah-voh) <br />
adj.    clever, capable, good<br />
interj. well done! <br />
n.      expert, clever/brilliant person <br />
<br /><i>adj. clever, capable, good</i> <br />
Example: "Sono abbastanza bravo in inglese" (I’m quite good at English) <br />
<i>interj. well done! </i> <br />
Example: "Bravo!" (Well done!) <br />
<i>n. expert, clever/brilliant person</i> <br />
Example: "Un bravo insegnante/medico" (A good teacher/doctor) <br />
\`. Make sure to put each definition and example on a new line using <br />. Separate each flashcard with NEW WORD and use HTML formatting for the definitions and example sentences. Try to be as coincise as possible with the definitions. Only put as many definitions as are necessary. I don't need every usage of the word, I need to learn the common usages of the word quickly. At the beginning of the definition is the simplified translation from italian to english, This is important so don't forget to do it.
  `;
}
