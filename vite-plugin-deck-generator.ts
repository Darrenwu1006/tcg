import { Plugin } from "vite";
import fs from "fs";
import path from "path";
import chokidar from "chokidar";

export default function deckGenerator(): Plugin {
  return {
    name: "vite-plugin-deck-generator",
    configureServer(server) {
      const poolDir = path.resolve(__dirname, "public/pool");

      // Watch for changes in the pool directory
      const watcher = chokidar.watch(poolDir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
      });

      watcher.on("change", (filePath) => {
        if (filePath.endsWith(".csv")) {
          console.log(`[Deck Generator] File changed: ${filePath}`);
          generateDeck(filePath);
        }
      });

      watcher.on("add", (filePath) => {
        if (filePath.endsWith(".csv")) {
          console.log(`[Deck Generator] File added: ${filePath}`);
          generateDeck(filePath);
        }
      });
    },
  };
}

function generateDeck(poolFilePath: string) {
  try {
    generateAllSchoolsDecks();
  } catch (error) {
    console.error(`[Deck Generator] Error processing ${poolFilePath}:`, error);
  }
}

function generateAllSchoolsDecks() {
  const poolDir = path.resolve(__dirname, "public/pool");
  const filesToRead = ["All_Characters.csv", "All_Events.csv"];
  const allCardsBySchool = new Map<string, { name: string; id: string; count: number }[]>();

  for (const fileName of filesToRead) {
    const filePath = path.join(poolDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    if (lines.length === 0) continue;

    // Detect column indices from header
    const headerParts = parseCSVLine(lines[0]);
    const schoolIdx = headerParts.findIndex(p => p.includes("School") || p.includes("學校"));
    const idIdx = headerParts.findIndex(p => p.includes("編號") || p.includes("ID"));
    const nameIdx = headerParts.findIndex(p => p.includes("名稱") || p.includes("Name"));
    
    // Fallback if header parsing fails
    const actualSchoolIdx = schoolIdx >= 0 ? schoolIdx : 0;
    const actualIdIdx = idIdx >= 0 ? idIdx : 2;
    const actualNameIdx = nameIdx >= 0 ? nameIdx : 3;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = parseCSVLine(line);
      const schoolField = parts[actualSchoolIdx]?.trim();
      const id = parts[actualIdIdx]?.trim();
      const name = parts[actualNameIdx]?.trim();

      if (!schoolField || !id || !name) continue;

      // Handle dual-school cards e.g. "烏野,音駒" or "烏野/音駒"
      const schools = schoolField.split(/[,/]/).map(s => s.trim().replace(/"/g, ''));
      
      for (const school of schools) {
        if (!allCardsBySchool.has(school)) {
          allCardsBySchool.set(school, []);
        }
        allCardsBySchool.get(school)!.push({ name, id, count: 3 });
      }
    }
  }

  // Generate deck files for each school found
  for (const [school, cards] of allCardsBySchool.entries()) {
    if (!school || school === "none") continue;

    const deckDir = path.resolve(__dirname, "public/deck", school);
    const deckFilePath = path.join(deckDir, `${school} - All Cards.csv`);

    // Deduplicate by ID
    const uniqueCards = new Map<string, { name: string; id: string; count: number }>();
    for (const card of cards) {
      if (!uniqueCards.has(card.id)) {
        uniqueCards.set(card.id, card);
      }
    }

    const sortedCards = Array.from(uniqueCards.values());
    sortedCards.sort((a, b) => a.id.localeCompare(b.id));

    let csvContent = "卡片名稱,卡片編號,數量\n";
    for (const card of sortedCards) {
      csvContent += `${card.name},${card.id},${card.count}\n`;
    }

    if (!fs.existsSync(deckDir)) {
      fs.mkdirSync(deckDir, { recursive: true });
    }

    try {
      fs.writeFileSync(deckFilePath, csvContent, "utf-8");
      // console.log(`[Deck Generator] Updated: ${deckFilePath}`);
    } catch (err) {
      console.error(`[Deck Generator] Failed to write deck for ${school}`, err);
    }
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
