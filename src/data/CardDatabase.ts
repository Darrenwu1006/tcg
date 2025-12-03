export interface CardPool {
  [cardId: string]: {
    id: string;
    name: string;
    type: "CHARACTER" | "EVENT";
    school: string;
    rarity: string;
    role: string;
    timing?: string;
    stats: {
      serve: number | null;
      block: number | null;
      receive: number | null;
      toss: number | null;
      attack: number | null;
    };
    skill: string;
    note: string;
  };
}

export class CardDatabase {
  private static instance: CardDatabase;
  private cards: Map<string, any> = new Map();
  private loaded = false;

  private constructor() {}

  static getInstance(): CardDatabase {
    if (!CardDatabase.instance) {
      CardDatabase.instance = new CardDatabase();
    }
    return CardDatabase.instance;
  }

  async loadAll() {
    if (this.loaded) return;

    try {
      await this.loadConsolidatedPools();
      this.loaded = true;
      console.log(`CardDatabase loaded ${this.cards.size} cards.`);
    } catch (error) {
      console.error("Failed to load card pools:", error);
    }
  }

  private resolvePath(path: string): string {
    const baseUrl = import.meta.env.BASE_URL;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return `${cleanBase}${cleanPath}`;
  }

  private async loadConsolidatedPools() {
    const charPoolUrl = this.resolvePath("pool/All_Characters.csv");
    const eventPoolUrl = this.resolvePath("pool/All_Events.csv");

    try {
      const [charRes, eventRes] = await Promise.all([
        fetch(charPoolUrl),
        fetch(eventPoolUrl),
      ]);

      if (charRes.ok) {
        const content = await charRes.text();
        this.parsePoolCSV(content, "CHARACTER");
      }

      if (eventRes.ok) {
        const content = await eventRes.text();
        this.parsePoolCSV(content, "EVENT");
      }

      console.log("Loaded consolidated pools");
    } catch (error) {
      console.error("Failed to load consolidated pools:", error);
    }
  }

  private parsePoolCSV(content: string, expectedType: "CHARACTER" | "EVENT") {
    const lines = content.split("\n");

    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = this.parseCSVLine(line);
      if (parts.length < 4) continue;

      // New format includes School as first column
      // CHARACTER: School,卡片類型,卡片編號,卡片名稱,時機點,稀有度,位置,發球,攔網,接球,托球,攻擊,完整技能,注釋
      // EVENT:     School,卡片類型,卡片編號,卡片名稱,稀有度,時機點,發球,攔網,接球,托球,攻擊,完整技能,注釋

      const school = parts[0]?.trim();
      const id = parts[2]?.trim();
      const name = parts[3]?.trim();

      if (!id || !name) continue;

      const parseStat = (val: string | undefined) => {
        if (!val || val.trim() === "-" || val.trim() === "") return null;
        const num = parseInt(val.trim());
        return isNaN(num) ? null : num;
      };

      if (expectedType === "CHARACTER") {
        this.cards.set(id, {
          id,
          name,
          type: "CHARACTER",
          school,
          timing: parts[4]?.trim() || "-",
          rarity: parts[5]?.trim() || "-",
          role: parts[6]?.trim() || "-",
          stats: {
            serve: parseStat(parts[7]),
            block: parseStat(parts[8]),
            receive: parseStat(parts[9]),
            toss: parseStat(parts[10]),
            attack: parseStat(parts[11]),
          },
          skill: parts[12]?.trim() || "-",
          note: parts[13]?.trim() || "-",
        });
      } else {
        this.cards.set(id, {
          id,
          name,
          type: "EVENT",
          school,
          rarity: parts[4]?.trim() || "-",
          timing: parts[5]?.trim() || "-",
          role: "-",
          stats: {
            serve: parseStat(parts[6]),
            block: parseStat(parts[7]),
            receive: parseStat(parts[8]),
            toss: parseStat(parts[9]),
            attack: parseStat(parts[10]),
          },
          skill: parts[11]?.trim() || "-",
          note: parts[12]?.trim() || "-",
        });
      }
    }
  }

  private parseCSVLine(line: string): string[] {
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

  getCard(id: string): any | undefined {
    return this.cards.get(id);
  }

  getAllCards() {
    return Array.from(this.cards.values());
  }

  // Helper method to get total card count from deck CSV content
  private getTotalCardCount(content: string): number {
    const lines = content.split("\n");
    let totalCount = 0;

    // Skip header (line 0): 卡片名稱,卡片編號,數量
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length < 2) continue;

      let count = 0; // Default to 0 if not specified

      if (parts.length >= 3) {
        const countStr = parts[2]?.trim();
        if (countStr) {
          const parsed = parseInt(countStr);
          if (!isNaN(parsed)) {
            count = parsed;
          }
        }
      }

      totalCount += count;
    }

    return totalCount;
  }

  // New method to get available decks using import.meta.glob
  async getAvailableDecks() {
    const deckFiles = import.meta.glob("/src/assets/decks/**/*.csv", {
      as: "raw",
    });
    const decks = [];

    for (const path in deckFiles) {
      const parts = path.split("/");
      const filename = parts[parts.length - 1];
      const school = parts[parts.length - 2]; // Assuming structure src/assets/decks/School/DeckName.csv
      const name = filename.replace(".csv", "");

      // Load the deck content to check card count
      try {
        const content = await deckFiles[path]();
        const cardCount = this.getTotalCardCount(content);

        // Only include decks with exactly 40 cards
        if (cardCount === 40) {
          decks.push({
            school,
            name,
            path,
            loader: deckFiles[path],
            cardCount,
          });
        }
      } catch (error) {
        console.warn(`Failed to load deck at ${path}:`, error);
      }
    }

    return decks;
  }

  async loadDeck(loader: () => Promise<string>): Promise<any[]> {
    try {
      const content = await loader();
      return this.parseDeckCSV(content);
    } catch (error) {
      console.error("Failed to load deck:", error);
      return [];
    }
  }

  private parseDeckCSV(content: string): any[] {
    const lines = content.split("\n");
    const deck: any[] = [];

    // Skip header (line 0): 卡片名稱,卡片編號,數量
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length < 2) continue; // Allow missing quantity

      const id = parts[1]?.trim();
      let count = 0; // Default to 0

      if (parts.length >= 3) {
        const countStr = parts[2]?.trim();
        if (countStr) {
          const parsed = parseInt(countStr);
          if (!isNaN(parsed)) {
            count = parsed;
          }
        }
      }

      if (!id || count === 0) continue;

      // Get card data from pool
      const cardData = this.getCard(id);
      if (cardData) {
        // Add card to deck based on quantity
        for (let j = 0; j < count; j++) {
          deck.push({
            ...cardData,
            instanceId: crypto.randomUUID(),
          });
        }
      } else {
        console.warn(`Card ID not found in pool: ${id}`);
      }
    }

    return deck;
  }
}
