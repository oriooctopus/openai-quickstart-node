import AnkiExport from "anki-apkg-export";
import { Configuration, OpenAIApi } from "openai";
import { words as frequencyList } from "/Users/oliverullman/coding/language/openai-quickstart-node/OldDeck/frequencyList.json";
import fs from "fs";

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const startIndex = 9;
const numberPerRequest = 15;
const iterations = 1;

const fileName = `${startIndex * numberPerRequest}-${
  (startIndex + iterations) * numberPerRequest
}`;

console.log("frequencyList", frequencyList);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const apkg = new AnkiExport("korean GPT test");

const addWordsFromResponse = (wordsToAdd, originalResponse) => {
  console.log("original response", originalResponse);
  const formattedResponse = originalResponse
    .split("NEW WORD")
    .filter((str) => Boolean(str));

  formattedResponse.forEach((definition, index) => {
    console.log("adding card", wordsToAdd[index], definition || "");
    apkg.addCard(wordsToAdd[index], definition || "");

    if (!definition) {
      console.log("no definition for", wordsToAdd[index]);
    }
  });
};

const generateFileFromResponse = () => {
  apkg
    .save()
    .then((zip) => {
      fs.writeFileSync(
        `/Users/oliverullman/coding/language/openai-quickstart-node/output/${fileName}.apkg`,
        zip,
        "binary"
      );
      console.log(`Package has been generated: output.pkg`);
    })
    .catch((err) => console.log(err.stack || err));
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
      const wordsToUse = ["annyeonghaseyo", "juseyo", "joesonghamnida"];
      console.log("words to use", wordsToUse);
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: generatePrompt(wordsToUse),
        temperature: 0.1,
        // maxLength: 1000,
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

  return `generate the backside of a flashcard for each of the following words: 안녕하세요, 주세요, 죄송합니다. These words are in korean. Here are some examples for italian for the words essere, grande, cosi, fino, quello, and bravo:\`<b>To be</b> - (eh-seh-reh) <br />
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

  // For example: \`<i>indicate a characteristic or quality</i> -  Example: "Questa mela è verde." (This apple is green.))\`

  return `Generate flashcards for the 25 most common words in italian. Include verbs, nouns, and adjectives. For verbs only use the infinitive form. Include the definitions and example sentences for every definition. If a word has multiple definitions include all of them. Also include pronounciation. Generate it as an array of tuples Where each tuple is one flashcard. The first entry in the tuple is The word, the second is everything else. For example: [
    ["essere", \`essere (eh-seh-reh)
indicate the existence or presence of someone or something
Example: "Io sono alto." (I am tall.)
indicate a characteristic or quality
Example: "Questa mela è verde." (This apple is green.)\`],
["avere", \`indicate possession or ownership
Example: "Ho un cane." (I have a dog.)
indicate age
Example: "Ho vent'anni." (I am 20 years old.)\`]
  ] . Put all the definitions and examples on a separate line using the newline symbol, '\n'. Make sure to return 200, if you don't return 200 tell me why not.`;
  return `generate a list of the 20 most common italian lemmas`;
  return ` at the end of this query I will include an array which has the values for a flash card that teaches Italian to English speakers. The first value in the array is the word being taught (the front side), the third value is the backside of the flashcards that actually explains the word by providing definitions. Return this array with the third value modified to include example sentences for each definition: [
                "e",
                "",
                "【e】★★★★★<br>1. conj. and<br>2. e (f)<br>n. e, fifth letter of the Italian alphabet",
                "",
                "[sound:1608354485.9586012.mp3]",
                "",
                "",
                ""
            ]`;
  // return `Correct this argentinian spanish text (but respect the argentinian dialect) and then explain in a bullet point list the mistakes I made and create flashcards for them. The flash cards should show a portion of the incorrect sentence (with enough surrounding words to provide the context) and then on the other side show the correction. For example, if the mistake was "tu leen mucho", w   Each correction and flashcard should be on a newline: ${text}`;

  //   const capitalizedAnimal =
  //     animal[0].toUpperCase() + animal.slice(1).toLowerCase();
  //   return `Suggest three names for an animal that is a superhero.

  // Animal: Cat
  // Names: Captain Sharpclaw, Agent Fluffball, The Incredible Feline
  // Animal: Dog
  // Names: Ruff the Protector, Wonder Canine, Sir Barks-a-Lot
  // Animal: ${capitalizedAnimal}
  // Names:`;
}

// avere (ah-veh-reh) <br />
// v. Have, own, possess, get, receive, obtain <br />
// n. possession, property, assset <br /> <br />
// <i>v. Have, own, possess, get, receive, obtain</i> <br>
// Example: "Ho un cane." (I have a dog.) <br />
// <i>n. possession, property, assset</i> <br />
// Example: "Ho vent'anni." (I am 20 years old.)
// NEW WORD
