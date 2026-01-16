import fs from "fs";
import path from "path";

// 定義技能介面
interface Skill {
  cardId: string;
  cardName: string;
  school?: string;
  originalText: string;
  trigger: {
    timing: string;
    condition: string;
  };
  effects: any[];
}

// 簡單 CSV 解析器
function parseCSV(content: string): any[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // 處理引號內的逗號 (簡單版：假設引號成對出現)
    const row: string[] = [];
    let current = "";
    let inQuote = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === "," && !inQuote) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current.trim());

    // 映射到物件
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] ? row[index].replace(/^"|"$/g, "") : "";
    });
    result.push(obj);
  }
  return result;
}

// 已知的可解析條件模式 (Regex)
const KNOWN_PATTERNS = [
  /^none$/,
  /^hand_count_under:\d+$/,
  /^hand_count_over:\d+$/,
  /^op_under:\d+$/,
  /^op_over:\d+$/,
  /^all_characters_school:.+$/,
  /^guts_is_odd$/,
  /^character_is:.+$/,
  /^stack_on:.+$/,
  /^stack_on_self:.+$/,
  /^stack_on_self_school:.+$/,
  /^toss_point_over:\d+$/,
];

async function main() {
  console.log("🏥 Skill Doctor: Starting diagnosis...");

  // 1. 讀取技能 JSON
  const charSkillsPath = path.join(
    process.cwd(),
    "public/skills/character_skills.json"
  );
  const eventSkillsPath = path.join(
    process.cwd(),
    "public/skills/event_skills.json"
  );

  const charSkills: Skill[] = JSON.parse(
    fs.readFileSync(charSkillsPath, "utf-8")
  );
  const eventSkills: Skill[] = JSON.parse(
    fs.readFileSync(eventSkillsPath, "utf-8")
  );
  const allSkills = [...charSkills, ...eventSkills];

  console.log(
    `Loaded ${charSkills.length} character skills and ${eventSkills.length} event skills.`
  );

  // 2. 讀取 CSV Pool (Source of Truth)
  const charCsvPath = path.join(
    process.cwd(),
    "public/pool/All_Characters.csv"
  );
  const eventCsvPath = path.join(process.cwd(), "public/pool/All_Events.csv");

  const charCsv = parseCSV(fs.readFileSync(charCsvPath, "utf-8"));
  const eventCsv = parseCSV(fs.readFileSync(eventCsvPath, "utf-8"));

  // 建立 CSV 索引
  const csvMap = new Map<string, any>();
  [...charCsv, ...eventCsv].forEach((row: any) => {
    if (row["卡片編號"]) {
      csvMap.set(row["卡片編號"], row);
    }
  });

  console.log(`Loaded ${csvMap.size} cards from CSV pool.`);

  // 3. 診斷
  const issues: any[] = [];
  const unparsedConditions: any[] = [];

  for (const skill of allSkills) {
    // 檢查 1: 條件是否可解析
    const condition = skill.trigger.condition;

    // 支援多重條件
    const subConditions = condition.split(",").map((c) => c.trim());
    let allKnown = true;

    for (const sub of subConditions) {
      if (sub === "none") continue;

      let isKnown = false;
      for (const pattern of KNOWN_PATTERNS) {
        if (pattern.test(sub)) {
          isKnown = true;
          break;
        }
      }

      if (!isKnown) {
        allKnown = false;
        break;
      }
    }

    if (!allKnown) {
      unparsedConditions.push({
        id: skill.cardId,
        name: skill.cardName,
        condition: condition,
        original: skill.originalText,
      });
    }

    // 檢查 2: 與 CSV 描述是否一致 (簡單長度檢查，避免過度敏感)
    const csvRow = csvMap.get(skill.cardId);
    if (csvRow) {
      const csvText = csvRow["完整技能"] || "";
      // 簡單比對：如果 JSON 中的 originalText 與 CSV 差異太大
      if (
        skill.originalText !== csvText &&
        csvText !== "-" &&
        csvText.trim() !== ""
      ) {
        // 這裡可以加入更細緻的比對邏輯
      }
    } else {
      issues.push({
        type: "MISSING_IN_POOL",
        id: skill.cardId,
        name: skill.cardName,
      });
    }
  }

  // 4. 輸出報告
  console.log("\n📋 Diagnosis Report:");
  console.log(`Total Skills Checked: ${allSkills.length}`);
  console.log(`Unparsed Conditions: ${unparsedConditions.length}`);
  console.log(`Missing in Pool: ${issues.length}`);

  if (unparsedConditions.length > 0) {
    console.log("\n⚠️  Skills with Unparsed/Natural Language Conditions:");
    unparsedConditions.forEach((item) => {
      console.log(`\n[${item.id}] ${item.name}`);
      console.log(`  Condition: "${item.condition}"`);
      console.log(`  Original:  "${item.original}"`);
    });
  }

  // 5. 自動修復建議 (模擬)
  console.log("\n💡 Suggestions:");
  console.log(
    "Review the 'Unparsed Conditions' list above. These conditions are likely treated as 'True' (always active) by the engine because they don't match any known logic pattern."
  );
  console.log(
    "You should update 'SkillExecutor.ts' to handle these patterns OR update the JSON to use standard patterns."
  );
}

main().catch(console.error);
