/**
 * 批量处理所有剩余学校的角色卡
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const PROCESSED_SCHOOLS = ["烏野", "青葉城西", "音駒", "梟谷"];

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║        批量处理剩余学校角色卡                      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 获取所有学校列表
  const { stdout } = await execAsync(
    `grep "^[^,]*,CHARACTER" public/pool/All_Characters.csv | cut -d',' -f1 | sort -u`
  );

  const allSchools = stdout
    .trim()
    .split("\n")
    .filter((s) => s);
  const remainingSchools = allSchools.filter(
    (s) => !PROCESSED_SCHOOLS.includes(s)
  );

  console.log(
    `已处理学校 (${PROCESSED_SCHOOLS.length}):`,
    PROCESSED_SCHOOLS.join(", ")
  );
  console.log(
    `\n待处理学校 (${remainingSchools.length}):`,
    remainingSchools.join(", ")
  );
  console.log("\n" + "=".repeat(60) + "\n");

  // 处理每个学校
  for (const school of remainingSchools) {
    console.log(`\n📋 处理: ${school}`);
    console.log("=".repeat(60));

    try {
      const { stdout, stderr } = await execAsync(
        `npx tsx scripts/process-character-skills.ts "${school}"`,
        { cwd: process.cwd() }
      );

      console.log(stdout);
      if (stderr) console.error("错误:", stderr);

      // 等待一下避免过载
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`处理 ${school} 时出错:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ 所有学校处理完成！");
}

main().catch(console.error);
