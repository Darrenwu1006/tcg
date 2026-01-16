/**
 * 卡池更新自動化腳本
 *
 * 用途：
 * 檢查 public/pool 下的 CSV 檔案是否有更新，並自動執行後續處理流程。
 *
 * 流程：
 * 1. 讀取 All_Characters.csv，找出所有出現的學校
 * 2. 針對每個學校，執行 process-character-skills.ts
 * 3. process-character-skills.ts 會自動將結果合併到 master JSON
 *
 * 使用：
 * npx tsx scripts/automation/update-card-pool.ts
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 專案根目錄
const ROOT_DIR = path.join(__dirname, "../../");
const POOL_DIR = path.join(ROOT_DIR, "public/pool");

/**
 * 從 CSV 讀取所有學校
 */
function getSchoolsFromCSV(): Set<string> {
  const csvPath = path.join(POOL_DIR, "All_Characters.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("❌ 找不到 CSV 檔案:", csvPath);
    return new Set();
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");
  const schools = new Set<string>();

  // 跳過標題行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    const school = parts[0]?.trim();

    if (school && school !== "School") {
      schools.add(school);
    }
  }

  return schools;
}

/**
 * 主函數
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║              卡池更新自動化系統                     ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 1. 偵測學校
  console.log("🔍 正在掃描 CSV 中的學校...");
  const schools = getSchoolsFromCSV();
  console.log(
    `✓ 找到 ${schools.size} 個學校: ${Array.from(schools).join(", ")}\n`
  );

  if (schools.size === 0) {
    console.log("⚠️  沒有找到任何學校資料");
    return;
  }

  // 2. 依序處理每個學校
  console.log("🚀 開始執行技能解析流程...\n");

  const schoolsArray = Array.from(schools);
  for (let i = 0; i < schoolsArray.length; i++) {
    const school = schoolsArray[i];
    console.log(`[${i + 1}/${schools.size}] 處理學校: ${school}`);

    try {
      // 執行 process-character-skills.ts (使用 --quiet 減少輸出)
      const command = `npx tsx scripts/process-character-skills.ts "${school}" --quiet`;
      console.log(`  > ${command}`);

      execSync(command, {
        cwd: ROOT_DIR,
        stdio: "inherit",
      });

      console.log(`  ✅ ${school} 處理完成\n`);
    } catch (error) {
      console.error(`  ❌ ${school} 處理失敗:`, error);
      // 不中斷，繼續處理下一個學校
    }
  }

  console.log("✨ 所有學校處理完成！ Master Skill File 已更新。");
}

main().catch(console.error);
