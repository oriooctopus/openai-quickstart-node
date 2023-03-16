const { Translate } = require("@google-cloud/translate").v2;

const translate = new Translate({
  source: "it",
});

const text = [
  "volta",
  "ne",
  "dove",
  "tempo",
  "mentre",
  "italiano",
  "ultimo",
  "sempre",
  "nome",
  "così",
  "città",
  "Italia",
  "fino",
  "durante",
  "ancora",
  "gruppo",
  "storia",
  "andare",
  "prima",
  "stesso",
  "esterno",
  "ogni",
];

export default async function detectLanguage(req, res) {
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  let [translations] = await translate.translate(text, "en");
  translations = Array.isArray(translations) ? translations : [translations];
  console.log("Translations:");
  translations.forEach((translation, i) => {
    console.log(`${text[i]} => ${translation}`);
  });

  res.status(200).json({ result: "done" });
}

function createPrompt(words) {
  const arrString = `[${words}]`;
  return `Create english translations for the following words: ${arrString} An example for the words "secondo, molto, iniziare, pubblicare, via, lasciare" the response would be "secondo - second, according to \n molto - very \n iniziare - to start \n pubblicare - to publish \n via - street, by way of \n to leave, to let, to release". Notice that sometimes there is only one translation, sometimes there are multiple, so create as many translations as you think is necessary for getting the point across (most of the time only one is necessary. That is important to take note of! Remember that most of the examples only had one translation because we want to be succint when possible). Also, can you create an example sentence for every definition? So "via" would have two sentences, one for its usage as street, and one for its usage as by way of, since two definitions were provided. The example sentences should be in Italian. For example: descrivere - to describe \nPosso descrivere il mio nuovo vestito in dettaglio.`;
}
