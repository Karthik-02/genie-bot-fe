const glob = require("glob");
const fs = require("fs");
const cheerio = require("cheerio");

const files = glob.sync("../web/views/**/*.ejs");

const results = [];

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");

  const $ = cheerio.load(content);

  const text = $("body").text() || $.text();

  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length > 100) {
    results.push({
      file,
      content: cleaned
    });
  }
});

fs.writeFileSync(
  "content.json",
  JSON.stringify(results, null, 2)
);

console.log("Extraction completed");
console.log(`Files processed: ${results.length}`);