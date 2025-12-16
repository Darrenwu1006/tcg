/**
 * 事件卡技能批量處理腳本
 * 使用 Ollama 解析所有事件卡技能
 */

import { Ollama } from "ollama";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ParsedSkill {
  cardId: string;
  cardName: string;
  school: string;
  rarity: string;
  timing: string;
  originalText: string;
  trigger: any;
  cost: any;
  effects: any[];
  parsed: boolean;
  parseError?: string;
}

/**
 * 解析 CSV 行
 */
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

/**
 * 從 CSV 載入事件卡
 */
function loadEventCards(): any[] {
  const csvPath = path.join(__dirname, "../public/pool/All_Events.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");

  const cards = [];

  // 跳過標題行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 12) continue;

    const school = parts[0]?.trim();
    const cardId = parts[2]?.trim();
    const name = parts[3]?.trim();
    const rarity = parts[4]?.trim();
    const timing = parts[5]?.trim();
    const skill = parts[11]?.trim();

    if (!cardId || !name || !skill || skill === "-") continue;

    cards.push({
      cardId,
      name,
      school,
      rarity,
      timing,
      skill,
    });
  }

  return cards;
}

/**
 * 使用 Ollama 解析技能
 */
async function parseSkillWithOllama(
  ollama: Ollama,
  card: any
): Promise<ParsedSkill> {
  const prompt = `請將以下排球Break遊戲卡片技能解析為結構化的JSON格式。

卡片：${card.name} (${card.rarity})
卡片時機：${card.timing}
技能文字：${card.skill}

重要規則：
1. timing 必須使用以下其中一個值（不要用 on_xxx 格式）：
   - "serve" (發球階段)
   - "block" (攔網階段)
   - "receive" (接球階段)
   - "toss" (托球階段)
   - "attack" (攻擊階段)
   - "draw" (抽牌階段)
   - "any" (任何時機)

2. 根據卡片的「時機」欄位選擇正確的 timing：
   - 發球 → "serve"
   - 攔網 → "block"
   - 接球 → "receive"
   - 舉球/托球 → "toss"
   - 攻擊 → "attack"
   - 抽牌 → "draw"
   - 如果有多個時機，選擇主要的一個

3. effects 中的 type 使用明確的類型：
   - "stat_boost" (點數增加)
   - "draw" (抽卡)
   - "discard" (棄牌)
   - "search" (檢索)
   - "special" (特殊效果)

請用以下JSON格式輸出：
{
  "trigger": {
    "timing": "serve",
    "condition": "觸發條件或'無'"
  },
  "cost": {
    "type": "guts | discard | none",
    "amount": 數量,
    "description": "成本描述"
  },
  "effects": [
    {
      "type": "stat_boost | draw | discard | search | special",
      "target": "self | opponent",
      "stat": "serve | block | receive | toss | attack",
      "value": 數值或描述,
      "condition": "條件（如有）"
    }
  ]
}

只需要輸出JSON，不要其他說明。`;

  try {
    const response = await ollama.chat({
      model: "llama3.2:3b",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.message.content.trim();

    // 提取 JSON（可能包含在解釋文字中）
    let jsonText = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonText);

    return {
      cardId: card.cardId,
      cardName: card.name,
      school: card.school,
      rarity: card.rarity,
      timing: card.timing,
      originalText: card.skill,
      trigger: parsed.trigger,
      cost: parsed.cost,
      effects: parsed.effects,
      parsed: true,
    };
  } catch (error) {
    return {
      cardId: card.cardId,
      cardName: card.name,
      school: card.school,
      rarity: card.rarity,
      timing: card.timing,
      originalText: card.skill,
      trigger: null,
      cost: null,
      effects: [],
      parsed: false,
      parseError: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 主函數
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║        事件卡技能批量處理系統                       ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 連接 Ollama
  const ollama = new Ollama({ host: "http://localhost:11434" });

  // 載入事件卡
  console.log("📋 載入事件卡...");
  const cards = loadEventCards();
  console.log(`✓ 載入 ${cards.length} 張事件卡\n`);

  // 處理每張卡
  const results: ParsedSkill[] = [];
  let successCount = 0;
  let failCount = 0;

  console.log("🔄 開始處理...\n");

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    console.log(
      `[${i + 1}/${cards.length}] 處理: ${card.name} (${card.cardId})`
    );

    const result = await parseSkillWithOllama(ollama, card);
    results.push(result);

    if (result.parsed) {
      console.log(`  ✅ 成功`);
      successCount++;
    } else {
      console.log(`  ❌ 失敗: ${result.parseError}`);
      failCount++;
    }

    // 防止過載，每次處理後暫停一下
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 保存結果
  console.log("\n💾 保存結果...");

  const outputDir = path.join(__dirname, "../public/skills");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "event_skills.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

  console.log(`✓ 結果已保存到: ${outputPath}\n`);

  // 統計
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║                    處理結果                         ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");
  console.log(`總卡片數: ${cards.length}`);
  console.log(
    `成功解析: ${successCount} 張 (${(
      (successCount / cards.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `解析失敗: ${failCount} 張 (${((failCount / cards.length) * 100).toFixed(
      1
    )}%)`
  );

  // 顯示失敗的卡片
  if (failCount > 0) {
    console.log("\n失敗的卡片：");
    results
      .filter((r) => !r.parsed)
      .forEach((r) => {
        console.log(`  - ${r.cardName} (${r.cardId}): ${r.parseError}`);
      });
  }

  console.log("\n✨ 處理完成！");
}

main().catch(console.error);
