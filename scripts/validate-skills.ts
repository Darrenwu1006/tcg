/**
 * 验证和修正角色卡技能解析
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SkillCard {
  cardId: string;
  cardName: string;
  originalText: string;
  trigger: any;
  cost: any;
  effects: any[];
  parsed: boolean;
}

// 从原文推断正确的 stat
function inferStatFromText(originalText: string, cardName: string): string[] {
  const stats: string[] = [];

  if (originalText.includes("攻擊點數") || originalText.includes("攻击点数")) {
    stats.push("attack");
  }
  if (
    originalText.includes("托球點數") ||
    originalText.includes("举球点数") ||
    originalText.includes("舉球點數")
  ) {
    stats.push("toss");
  }
  if (originalText.includes("接球點數") || originalText.includes("接球点数")) {
    stats.push("receive");
  }
  if (originalText.includes("攔網點數") || originalText.includes("拦网点数")) {
    stats.push("block");
  }
  if (originalText.includes("發球點數") || originalText.includes("发球点数")) {
    stats.push("serve");
  }

  return stats;
}

// 验证并修正
function validateAndFix(cards: SkillCard[]): { fixed: number; issues: any[] } {
  let fixed = 0;
  const issues: any[] = [];

  cards.forEach((card, index) => {
    if (!card.parsed) return;

    const correctStats = inferStatFromText(card.originalText, card.cardName);

    card.effects.forEach((effect, effectIndex) => {
      if (effect.type === "stat_boost") {
        if (!effect.stat) {
          issues.push({
            card: card.cardName,
            cardId: card.cardId,
            issue: "missing stat field",
            originalText: card.originalText,
          });
          return;
        }

        // 检查 stat 是否正确
        const currentStat = effect.stat;
        const validStats = ["serve", "block", "receive", "toss", "attack"];

        if (!validStats.includes(currentStat)) {
          // stat 字段不是标准值，尝试修正
          if (correctStats.length > 0) {
            effect.stat = correctStats[0];
            fixed++;
            console.log(`✓ 修正: ${card.cardName} (${card.cardId})`);
            console.log(`  ${currentStat} → ${correctStats[0]}`);
          } else {
            issues.push({
              card: card.cardName,
              cardId: card.cardId,
              issue: `invalid stat: ${currentStat}`,
              originalText: card.originalText,
              correctStats,
            });
          }
        } else if (
          correctStats.length > 0 &&
          !correctStats.includes(currentStat)
        ) {
          // stat 是标准值但可能不对
          console.log(`⚠️  可能错误: ${card.cardName} (${card.cardId})`);
          console.log(
            `  当前: ${currentStat}, 原文提到: ${correctStats.join(", ")}`
          );
          console.log(`  原文: ${card.originalText.substring(0, 80)}...`);

          // 自动修正明显错误
          effect.stat = correctStats[0];
          fixed++;
          console.log(`  → 已修正为: ${correctStats[0]}\n`);
        }
      }
    });
  });

  return { fixed, issues };
}

function main() {
  const jsonPath = path.join(
    __dirname,
    "../public/skills/character_skills_烏野.json"
  );

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║        烏野角色卡技能验证与修正                    ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 读取文件
  const data: SkillCard[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`📋 载入 ${data.length} 张卡片\n`);

  // 验证并修正
  console.log("🔍 开始验证...\n");
  const { fixed, issues } = validateAndFix(data);

  // 保存修正后的文件
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║                    验证结果                         ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");
  console.log(`修正数量: ${fixed}`);
  console.log(`问题数量: ${issues.length}`);

  if (issues.length > 0) {
    console.log("\n需要人工检查的问题:");
    issues.forEach((issue) => {
      console.log(`\n- ${issue.card} (${issue.cardId})`);
      console.log(`  问题: ${issue.issue}`);
      console.log(`  原文: ${issue.originalText}`);
    });
  }

  console.log("\n✨ 完成！");
}

main();
