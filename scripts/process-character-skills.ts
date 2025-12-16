/**
 * 角色卡技能批量处理脚本（按学校）
 * 使用 Ollama 解析指定学校的角色卡技能
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
  role: string;
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
 * 从 CSV 载入角色卡（指定学校）
 */
function loadCharacterCards(targetSchool: string): any[] {
  const csvPath = path.join(__dirname, "../public/pool/All_Characters.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");

  const cards = [];

  // 跳过标题行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 13) continue;

    const school = parts[0]?.trim();
    const type = parts[1]?.trim();
    const cardId = parts[2]?.trim();
    const name = parts[3]?.trim();
    const timing = parts[4]?.trim();
    const rarity = parts[5]?.trim();
    const role = parts[6]?.trim();
    const skill = parts[12]?.trim();

    // 过滤：只处理指定学校的角色卡
    if (type !== "CHARACTER") continue;
    if (school !== targetSchool) continue;
    if (!cardId || !name) continue;
    if (!skill || skill === "-") continue;

    cards.push({
      cardId,
      name,
      school,
      rarity,
      role,
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
  const prompt = `請將以下排球Break遊戲角色卡技能解析為結構化的JSON格式。

卡片：${card.name} (${card.rarity}, ${card.role})
學校：${card.school}
時機：${card.timing}
技能文字：${card.skill}

重要規則：
1. timing 必須使用以下其中一個值：
   - "serve" (發球階段)
   - "block" (攔網階段)  
   - "receive" (接球階段)
   - "toss" (托球階段)
   - "attack" (攻擊階段)
   - "draw" (抽牌階段)
   - "on_play" (登場時)
   - "any" (任何時機)

2. 根據卡片的「時機」欄位選擇：
   - 登場 → "on_play"
   - 發球 → "serve"
   - 攔網 → "block"  
   - 接球 → "receive"
   - 舉球/托球 → "toss"
   - 攻擊 → "attack"
   - 有多個時機時，列出所有（用逗號分隔）

3. cost.type 使用：
   - "guts" (支付毅力)
   - "discard" (棄牌)
   - "none" (無成本)

4. effects 類型：
   - "stat_boost" (點數增加)
   - "draw" (抽卡)
   - "discard" (棄牌)
   - "search" (檢索)
   - "special" (特殊效果)

請用此JSON格式：
{
  "trigger": {
    "timing": "on_play",
    "condition": "觸發條件或'無'"
  },
  "cost": {
    "type": "none",
    "amount": 0,
    "description": ""
  },
  "effects": [
    {
      "type": "stat_boost",
      "target": "self",
      "stat": "serve",
      "value": 1,
      "condition": ""
    }
  ]
}

只輸出JSON，不要其他說明。`;

  try {
    const response = await ollama.chat({
      model: "llama3.2:3b",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.message.content.trim();

    // 提取 JSON
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
      role: card.role,
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
      role: card.role,
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
 * 主函数
 */
async function main() {
  // 从命令行参数获取学校名称
  const targetSchool = process.argv[2] || "烏野";

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log(`║        ${targetSchool} 角色卡技能批量處理系統              ║`);
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 连接 Ollama
  const ollama = new Ollama({ host: "http://localhost:11434" });

  // 载入角色卡
  console.log(`📋 載入 ${targetSchool} 角色卡...`);
  const cards = loadCharacterCards(targetSchool);
  console.log(`✓ 載入 ${cards.length} 張角色卡\n`);

  if (cards.length === 0) {
    console.log("⚠️  沒有找到角色卡");
    return;
  }

  // 处理每张卡
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

    // 防止过载
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 保存结果
  console.log("\n💾 保存結果...");

  const outputDir = path.join(__dirname, "../public/skills");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(
    outputDir,
    `character_skills_${targetSchool}.json`
  );
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

  console.log(`✓ 結果已保存到: ${outputPath}\n`);

  // 统计
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║                    處理結果                         ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");
  console.log(`學校: ${targetSchool}`);
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

  // 显示失败的卡片
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
