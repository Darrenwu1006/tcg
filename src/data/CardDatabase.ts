export interface CardPool {
  [cardId: string]: {
    id: string;
    name: string;
    type: "CHARACTER" | "EVENT";
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
      // Load pool data for all available schools
      const schools = ["青葉城西", "烏野", "音駒", "梟谷"];
      for (const school of schools) {
        await this.loadSchoolPool(school);
      }

      this.loaded = true;
      console.log(
        `CardDatabase loaded ${this.cards.size} cards from ${schools.length} school(s).`
      );
    } catch (error) {
      console.error("Failed to load card pools:", error);
    }
  }

  private async loadSchoolPool(school: string) {
    const characterPoolUrl = `/pool/${school}/${school}卡表 - 卡池_角色卡.csv`;
    const eventPoolUrl = `/pool/${school}/${school}卡表 - 卡池_事件卡.csv`;

    try {
      const [charRes, eventRes] = await Promise.all([
        fetch(characterPoolUrl),
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

      console.log(`Loaded pool for ${school}`);
    } catch (error) {
      console.error(`Failed to load pool for ${school}:`, error);
    }
  }

  private parsePoolCSV(content: string, expectedType: "CHARACTER" | "EVENT") {
    const lines = content.split("\n");

    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma, but handle quoted fields
      const parts = this.parseCSVLine(line);

      if (parts.length < 3) continue;

      // Character cards format: 卡片類型,卡片編號,卡片名稱,時機點,稀有度,位置,發球,攔網,接球,托球,攻擊,完整技能,注釋
      // Event cards format:     卡片類型,卡片編號,卡片名稱,稀有度,時機點,發球,攔網,接球,托球,攻擊,完整技能,注釋
      // Note: Event cards have rarity and timing swapped compared to character cards

      const id = parts[1]?.trim();
      const name = parts[2]?.trim();

      if (!id || !name) continue;

      const parseStat = (val: string | undefined) => {
        if (!val || val.trim() === "-" || val.trim() === "") return null;
        const num = parseInt(val.trim());
        return isNaN(num) ? null : num;
      };

      if (expectedType === "CHARACTER") {
        // CHARACTER: 卡片類型,卡片編號,卡片名稱,時機點,稀有度,位置,發球,攔網,接球,托球,攻擊,完整技能,注釋
        this.cards.set(id, {
          id,
          name,
          type: "CHARACTER",
          timing: parts[3]?.trim() || "-",
          rarity: parts[4]?.trim() || "-",
          role: parts[5]?.trim() || "-",
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
      } else {
        // EVENT: 卡片類型,卡片編號,卡片名稱,稀有度,時機點,發球,攔網,接球,托球,攻擊,完整技能,注釋
        // Note: rarity and timing are swapped compared to CHARACTER cards
        this.cards.set(id, {
          id,
          name,
          type: "EVENT",
          rarity: parts[3]?.trim() || "-",
          timing: parts[4]?.trim() || "-",
          role: "-",
          stats: {
            serve: parseStat(parts[5]),
            block: parseStat(parts[6]),
            receive: parseStat(parts[7]),
            toss: parseStat(parts[8]),
            attack: parseStat(parts[9]),
          },
          skill: parts[10]?.trim() || "-",
          note: parts[11]?.trim() || "-",
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

  async loadDeck(school: string, deckName: string): Promise<any[]> {
    const deckUrl = `/deck/${school}/${deckName}.csv`;

    try {
      const res = await fetch(deckUrl);
      if (!res.ok) throw new Error(`Failed to fetch deck: ${deckUrl}`);

      const content = await res.text();
      return this.parseDeckCSV(content);
    } catch (error) {
      console.error(`Failed to load deck ${deckName} for ${school}:`, error);
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
      if (parts.length < 3) continue;

      const id = parts[1]?.trim();
      const countStr = parts[2]?.trim();
      const count = parseInt(countStr);

      if (!id || isNaN(count) || count === 0) continue;

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
