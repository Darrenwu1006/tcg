/**
 * 验证音駒和梟谷角色卡
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
  effects: any[];
  parsed: boolean;
}

function inferStatFromText(originalText: string): string[] {
  const stats: string[] = [];
  if (originalText.includes("攻擊點數")) stats.push("attack");
  if (originalText.includes("托球點數") || originalText.includes("舉球點數"))
    stats.push("toss");
  if (originalText.includes("接球點數")) stats.push("receive");
  if (originalText.includes("攔網點數")) stats.push("block");
  if (originalText.includes("發球點數")) stats.push("serve");
  return stats;
}

function validateAndFix(cards: SkillCard[], filename: string): number {
  const validStats = ["serve", "block", "receive", "toss", "attack", "any"];
  let fixed = 0;

  cards.forEach((card) => {
    if (!card.parsed) return;

    if (card.effects && Array.isArray(card.effects)) {
      card.effects.forEach((effect) => {
        if (effect.type === "stat_boost" && effect.stat) {
          const currentStat = effect.stat;

          if (!validStats.includes(currentStat)) {
            const correctStats = inferStatFromText(card.originalText);
            if (correctStats.length > 0) {
              console.log(
                `✓ ${card.cardName}: ${currentStat} → ${correctStats[0]}`
              );
              effect.stat = correctStats[0];
              fixed++;
            }
          } else {
            const correctStats = inferStatFromText(card.originalText);
            if (
              correctStats.length > 0 &&
              !correctStats.includes(currentStat)
            ) {
              console.log(
                `✓ ${card.cardName}: ${currentStat} → ${correctStats[0]}`
              );
              effect.stat = correctStats[0];
              fixed++;
            }
          }
        }
      });
    }
  });

  return fixed;
}

function main() {
  const files = [
    "../public/skills/character_skills_音駒.json",
    "../public/skills/character_skills_梟谷.json",
  ];

  let totalFixed = 0;

  files.forEach((file) => {
    const filePath = path.join(__dirname, file);
    const schoolName = file.includes("音駒") ? "音駒" : "梟谷";

    console.log(`\n📋 检查 ${schoolName}...`);
    const data: SkillCard[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const fixed = validateAndFix(data, schoolName);
    totalFixed += fixed;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`   修正: ${fixed} 个`);
  });

  console.log(`\n✨ 总计修正: ${totalFixed} 个\n`);
}

main();
