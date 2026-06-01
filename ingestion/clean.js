const fs = require("fs");

const raw = JSON.parse(
  fs.readFileSync("content.json", "utf-8")
);

const cleaned = raw.map((item) => {

  let text = item.content;

  // remove extra spaces
  text = text.replace(/\s+/g, " ");

  // remove repeated menu words
  const noiseWords = [
    "Home",
    "Contact Us",
    "Career",
    "Resources",
    "Blogs",
    "News"
  ];

  noiseWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    text = text.replace(regex, "");
  });

  text = text.trim();

  return {
    source: item.file,
    content: text
  };
});

fs.writeFileSync(
  "cleaned.json",
  JSON.stringify(cleaned, null, 2)
);

console.log("Cleaning completed");