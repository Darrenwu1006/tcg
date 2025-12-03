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
    const content = fs.readFileSync(poolFilePath, "utf-8");
    const lines = content.split("\n");
    const deckCards: { name: string; id: string; count: number }[] = [];

    // Determine if it's a character or event pool based on filename or content
    // But actually, the structure is similar enough for ID and Name extraction:
    // Character: Type, ID, Name, ...
    // Event: Type, ID, Name, ...
    // Both have ID at index 1 and Name at index 2 (0-indexed)

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = parseCSVLine(line);
      if (parts.length < 3) continue;

      const id = parts[1]?.trim();
      const name = parts[2]?.trim();

      if (id && name) {
        deckCards.push({ name, id, count: 3 });
      }
    }

    if (deckCards.length === 0) {
      console.log(`[Deck Generator] No cards found in ${poolFilePath}`);
      return;
    }

    // Construct deck file path
    // poolFilePath: .../public/pool/[School]/[Filename].csv
    // Target: .../public/deck/[School]/[School] - All Cards.csv

    const pathParts = poolFilePath.split(path.sep);
    const schoolIndex = pathParts.findIndex((p) => p === "pool") + 1;
    if (schoolIndex <= 0 || schoolIndex >= pathParts.length) {
      console.error(
        `[Deck Generator] Could not determine school from path: ${poolFilePath}`
      );
      return;
    }

    const school = pathParts[schoolIndex];
    const deckDir = path.resolve(__dirname, "public/deck", school);
    const deckFilePath = path.join(deckDir, `${school} - All Cards.csv`);

    // Ensure deck directory exists
    if (!fs.existsSync(deckDir)) {
      fs.mkdirSync(deckDir, { recursive: true });
    }

    // If the file already exists, we might want to merge or overwrite.
    // For "All Cards", we probably want to overwrite or at least ensure all cards are present.
    // To keep it simple and robust as requested: "Create a file with ALL player list"
    // We will read existing file to preserve other decks? No, the requirement is to create a SPECIFIC file.
    // "create a file with all player list... convenient for me to maintain"
    // So we should probably accumulate cards if there are multiple pool files (Character + Event).

    // Strategy:
    // 1. Read existing "All Cards" deck if it exists.
    // 2. Read ALL pool files for that school (Character + Event).
    // 3. Re-generate the COMPLETE "All Cards" deck.
    // This avoids the issue of overwriting Character cards when Event pool changes, and vice versa.

    generateAllCardsDeckForSchool(school);
  } catch (error) {
    console.error(`[Deck Generator] Error processing ${poolFilePath}:`, error);
  }
}

function generateAllCardsDeckForSchool(school: string) {
  const poolDir = path.resolve(__dirname, "public/pool", school);
  const deckDir = path.resolve(__dirname, "public/deck", school);
  const deckFilePath = path.join(deckDir, `${school} - All Cards.csv`);

  if (!fs.existsSync(poolDir)) {
    console.error(`[Deck Generator] Pool directory not found: ${poolDir}`);
    return;
  }

  const allCards: { name: string; id: string; count: number }[] = [];
  const files = fs.readdirSync(poolDir);

  for (const file of files) {
    if (file.endsWith(".csv")) {
      const filePath = path.join(poolDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = parseCSVLine(line);
        if (parts.length < 3) continue;

        const id = parts[1]?.trim();
        const name = parts[2]?.trim();

        // Basic validation to ensure it looks like a card row
        if (id && name) {
          allCards.push({ name, id, count: 3 });
        }
      }
    }
  }

  if (allCards.length === 0) {
    console.log(`[Deck Generator] No cards found for school: ${school}`);
    return;
  }

  // Deduplicate by ID
  const uniqueCards = new Map<
    string,
    { name: string; id: string; count: number }
  >();
  for (const card of allCards) {
    if (!uniqueCards.has(card.id)) {
      uniqueCards.set(card.id, card);
    }
  }

  const sortedCards = Array.from(uniqueCards.values());
  // Sort by ID for consistency
  sortedCards.sort((a, b) => a.id.localeCompare(b.id));

  // Generate CSV Content
  let csvContent = "卡片名稱,卡片編號,數量\n";
  for (const card of sortedCards) {
    csvContent += `${card.name},${card.id},${card.count}\n`;
  }

  // Ensure deck directory exists
  if (!fs.existsSync(deckDir)) {
    fs.mkdirSync(deckDir, { recursive: true });
  }

  fs.writeFileSync(deckFilePath, csvContent, "utf-8");
  console.log(`[Deck Generator] Updated: ${deckFilePath}`);
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
