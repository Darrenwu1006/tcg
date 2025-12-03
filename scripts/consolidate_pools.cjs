const fs = require("fs");
const path = require("path");

const poolDir = path.join(__dirname, "../public/pool");
const outputDir = path.join(__dirname, "../public/pool");

const schools = ["青葉城西", "烏野", "音駒", "梟谷"];

const charHeader =
  "School,卡片類型,卡片編號,卡片名稱,時機點,稀有度,位置,發球,攔網,接球,托球,攻擊,完整技能,注釋";
const eventHeader =
  "School,卡片類型,卡片編號,卡片名稱,稀有度,時機點,發球,攔網,接球,托球,攻擊,完整技能,注釋";

let allChars = [charHeader];
let allEvents = [eventHeader];

schools.forEach((school) => {
  const schoolDir = path.join(poolDir, school);

  // Find character file
  const charFile = fs
    .readdirSync(schoolDir)
    .find(
      (f) =>
        f.includes("卡池_角色卡.csv") ||
        (f.includes("卡池") && !f.includes("事件卡"))
    );
  if (charFile) {
    const content = fs.readFileSync(path.join(schoolDir, charFile), "utf-8");
    const lines = content
      .split("\n")
      .slice(1)
      .filter((l) => l.trim());
    lines.forEach((line) => {
      allChars.push(`${school},${line}`);
    });
    console.log(`Processed characters for ${school}`);
  }

  // Find event file
  const eventFile = fs
    .readdirSync(schoolDir)
    .find((f) => f.includes("卡池_事件卡.csv"));
  if (eventFile) {
    const content = fs.readFileSync(path.join(schoolDir, eventFile), "utf-8");
    const lines = content
      .split("\n")
      .slice(1)
      .filter((l) => l.trim());
    lines.forEach((line) => {
      allEvents.push(`${school},${line}`);
    });
    console.log(`Processed events for ${school}`);
  } else {
    // Fallback for schools where events might be in the main file (like Nekoma potentially based on previous file list)
    // Actually Nekoma had separate files in the file list I saw earlier.
    // Let's check if there is a file that contains "事件卡"
    const potentialEventFile = fs
      .readdirSync(schoolDir)
      .find((f) => f.includes("事件卡"));
    if (potentialEventFile && potentialEventFile !== eventFile) {
      const content = fs.readFileSync(
        path.join(schoolDir, potentialEventFile),
        "utf-8"
      );
      const lines = content
        .split("\n")
        .slice(1)
        .filter((l) => l.trim());
      lines.forEach((line) => {
        allEvents.push(`${school},${line}`);
      });
      console.log(`Processed events for ${school} (fallback)`);
    }
  }
});

fs.writeFileSync(
  path.join(outputDir, "All_Characters.csv"),
  allChars.join("\n")
);
fs.writeFileSync(path.join(outputDir, "All_Events.csv"), allEvents.join("\n"));

console.log("Consolidation complete.");
