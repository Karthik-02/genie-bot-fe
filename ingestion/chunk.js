const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("cleaned.json", "utf-8")
);

const chunks = [];

const CHUNK_SIZE = 500;

data.forEach((item, index) => {

  const text = item.content;

  for (let i = 0; i < text.length; i += CHUNK_SIZE) {

    const chunk = text.slice(i, i + CHUNK_SIZE);

    chunks.push({
      id: `chunk_${index}_${i}`,
      source: item.source,
      content: chunk
    });
  }
});

fs.writeFileSync(
  "chunks.json",
  JSON.stringify(chunks, null, 2)
);

console.log(`Chunks created: ${chunks.length}`);