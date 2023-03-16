var fs = require("fs");

const fileDir =
  "/Users/oliverullman/coding/language/openai-quickstart-node/output/";
const txtFileName = "englishToItalian915-1200.txt";
const csvFileName = "englishToItalian915-1200.csv";
const newPath = `${fileDir}/${csvFileName}`;

const text = fs.readFileSync(`${fileDir}/${txtFileName}`, "utf8");

// when it was just a word and def
// const csv = text
//   .split("\n")
//   .map((str) => {
//     return str
//       .split("-")
//       .map((strPart) => `"${strPart.trim()}"`)
//       .reverse()
//       .join(",");
//   })
//   .join("\n");

const csv = text
  .split("NEW CARD")
  // remove the first empty string
  .slice(1)
  .map((str) => {
    const [italian, englishAndSentences] = str.split("-");
    const splitEnglishAndSentences = englishAndSentences.split("\n");

    return [
      `"${englishAndSentences.split("\n")[0].trim()}"`,
      `"${italian}<br />${
        splitEnglishAndSentences[splitEnglishAndSentences[1] === "" ? 2 : 1]
      }"`,
    ].join(",");
  })
  .join("\n");

fs.writeFile(newPath, csv, (err) => {
  if (err) console.log(err);
  else {
    console.log("File written successfully\n");
    console.log("The written has the following contents:");
    console.log(fs.readFileSync(newPath, "utf8"));
  }
});
