/**
 * 角色卡技能批量处理脚本（按学校）
 * 使用 Google Gemini 解析指定学校的角色卡技能
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import "dotenv/config"; // Load environment variables

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
 * 使用 Gemini 解析技能
 */
async function parseSkillWithGemini(
  model: any,
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

4. trigger.condition 必須轉換為以下代碼 (若無條件則填 "none")：
   - 手牌數小於 X: "hand_count_under:X"
   - 手牌數大於 X: "hand_count_over:X"
   - 對手 OP 小於 X: "op_under:X"
   - 對手 OP 大於 X: "op_over:X"
   - 場上角色皆為某學校: "all_characters_school:學校名"
   - 毅力區總和為奇數: "guts_is_odd"
   - 場上有某角色: "character_is:角色名"
   - 疊在某角色上方: "stack_on:角色名"
   - 疊在自己上方: "stack_on_self"
   - 托球點數大於 X: "toss_point_over:X"
   - 必須是第一回合: "is_first_turn"
   - 必須是發球回合: "is_serve_turn"
   - 複合條件用逗號分隔

5. effects 類型：
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();

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
  console.log(
    `║        ${targetSchool} 角色卡技能批量處理系統 (Gemini)      ║`
  );
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 检查 API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ 錯誤：找不到 GEMINI_API_KEY 環境變數");
    console.error("請在專案根目錄建立 .env 檔案並設定 GEMINI_API_KEY");
    process.exit(1);
  }

  // 初始化 Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    if (!process.argv.includes("--quiet")) {
      console.log("🔌 測試 Gemini 連線...");
    }
    // 簡單測試
    await model.generateContent("Test connection");
    if (!process.argv.includes("--quiet")) {
      console.log("✓ Gemini 連線成功");
    }
  } catch (error) {
    console.error("\n❌ 無法連接到 Gemini API！");
    console.error("請確認：");
    console.error("1. 您的 API Key 是否正確？");
    console.error("2. 網路連線是否正常？");
    console.error(
      "3. 錯誤訊息:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }

  // 载入角色卡
  console.log(`📋 載入 ${targetSchool} 角色卡...`);
  const cards = loadCharacterCards(targetSchool);
  console.log(`✓ 載入 ${cards.length} 張角色卡\n`);

  if (cards.length === 0) {
    console.log("⚠️  沒有找到角色卡");
    return;
  }

  // 處理每张卡
  const results: ParsedSkill[] = [];
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  const isQuiet = process.argv.includes("--quiet");

  // 1. 嘗試讀取現有的 JSON 檔案
  const outputDir = path.join(__dirname, "../public/skills");
  const outputPath = path.join(
    outputDir,
    `character_skills_${targetSchool}.json`
  );

  const existingSkillsMap = new Map<string, ParsedSkill>();
  if (fs.existsSync(outputPath)) {
    try {
      const existingContent = fs.readFileSync(outputPath, "utf-8");
      const existingSkills = JSON.parse(existingContent) as ParsedSkill[];
      for (const skill of existingSkills) {
        existingSkillsMap.set(skill.cardId, skill);
      }
      if (!isQuiet) {
        console.log(
          `ℹ️  已讀取現有 ${existingSkills.length} 筆技能資料用於比對`
        );
      }
    } catch (e) {
      console.warn("⚠️  讀取現有檔案失敗，將重新建立所有資料");
    }
  }

  console.log("🔄 開始處理...\n");

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    // 檢查是否已存在且未變更
    const existingSkill = existingSkillsMap.get(card.cardId);

    // 判斷是否需要重新解析
    // 條件：存在 + 已解析成功 + 原始文字相同
    if (
      existingSkill &&
      existingSkill.parsed &&
      existingSkill.originalText === card.skill
    ) {
      if (!isQuiet) {
        console.log(
          `[${i + 1}/${cards.length}] 跳過: ${card.name} (${
            card.cardId
          }) - 無變更`
        );
      }
      results.push(existingSkill);
      skippedCount++;
      successCount++; // 視為成功
      continue;
    }

    if (!isQuiet) {
      console.log(
        `[${i + 1}/${cards.length}] 處理: ${card.name} (${card.cardId}) ${
          existingSkill ? "(更新)" : "(新增)"
        }`
      );
    }

    const result = await parseSkillWithGemini(model, card);
    results.push(result);

    if (result.parsed) {
      console.log(`  ✅ 成功`);
      successCount++;
    } else {
      console.log(`  ❌ 失敗: ${result.parseError}`);
      failCount++;
    }

    // 防止 API Rate Limit (Gemini 限制較寬鬆，但稍微延遲較安全)
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // 保存结果
  console.log("\n💾 保存結果...");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // outputPath 已經在前面定義過
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
  console.log(`跳過處理: ${skippedCount} 張 (未變更)`);
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

  // 更新 Master Skill File
  console.log("\n🔄 更新 Master Skill File (character_skills.json)...");
  updateMasterSkillFile();
}

/**
 * 更新主技能檔案 (合併所有學校的技能)
 */
function updateMasterSkillFile() {
  const outputDir = path.join(__dirname, "../public/skills");
  const masterPath = path.join(outputDir, "character_skills.json");
  const allSkills: ParsedSkill[] = [];
  const cardIdSet = new Set<string>();

  // 讀取所有 character_skills_*.json 檔案
  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);

    for (const file of files) {
      // 匹配 pattern: character_skills_*.json，排除 character_skills.json
      if (
        file.startsWith("character_skills_") &&
        file !== "character_skills.json" &&
        file.endsWith(".json")
      ) {
        try {
          const filePath = path.join(outputDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const skills = JSON.parse(content) as ParsedSkill[];

          console.log(`  - 合併: ${file} (${skills.length} 技能)`);

          for (const skill of skills) {
            // 避免重複 (以 cardId 為準)
            if (!cardIdSet.has(skill.cardId)) {
              allSkills.push(skill);
              cardIdSet.add(skill.cardId);
            }
          }
        } catch (e) {
          console.warn(`  ⚠️ 無法解析 ${file}:`, e);
        }
      }
    }
  }

  // 寫入主檔案
  fs.writeFileSync(masterPath, JSON.stringify(allSkills, null, 2), "utf-8");
  console.log(
    `✓ Master skill file updated: ${masterPath} (總計 ${allSkills.length} 技能)`
  );
}

main().catch(console.error);
