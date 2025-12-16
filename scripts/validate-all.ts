/**
 * 全面验证和修正事件卡和角色卡
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
  school?: string;
  timing?: string;
  originalText: string;
  trigger: any;
  cost: any;
  effects: any[];
  parsed: boolean;
}

interface ValidationIssue {
  file: string;
  cardId: string;
  cardName: string;
  issue: string;
  field: string;
  currentValue: any;
  suggestedValue?: any;
  fixed: boolean;
}

// 从原文推断正确的 stat
function inferStatFromText(originalText: string): string[] {
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

// 从原文和timing推断正确的trigger timing
function inferTriggerTiming(
  originalText: string,
  cardTiming?: string
): string[] {
  const timings: string[] = [];

  // 从卡片的 timing 字段推断
  if (cardTiming) {
    if (cardTiming.includes("登場")) timings.push("on_play");
    if (cardTiming.includes("發球")) timings.push("serve");
    if (cardTiming.includes("攔網")) timings.push("block");
    if (cardTiming.includes("接球")) timings.push("receive");
    if (cardTiming.includes("舉球") || cardTiming.includes("托球"))
      timings.push("toss");
    if (cardTiming.includes("攻擊")) timings.push("attack");
    if (cardTiming.includes("抽牌")) timings.push("draw");
  }

  return timings;
}

function validateAndFix(
  cards: SkillCard[],
  filename: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const validStats = ["serve", "block", "receive", "toss", "attack", "any"];
  const validTimings = [
    "serve",
    "block",
    "receive",
    "toss",
    "attack",
    "draw",
    "on_play",
    "any",
  ];

  cards.forEach((card) => {
    if (!card.parsed) return;

    // 检查 trigger.timing
    if (card.trigger && card.trigger.timing) {
      const currentTiming = card.trigger.timing;

      // 检查是否包含无效格式
      if (typeof currentTiming === "string") {
        // 检查是否有旧格式 "on_xxx | on_yyy"
        if (
          currentTiming.includes("|") ||
          currentTiming.includes("on_serve") ||
          currentTiming.includes("on_block") ||
          currentTiming.includes("on_receive") ||
          currentTiming.includes("on_toss") ||
          currentTiming.includes("on_attack")
        ) {
          const correctTimings = inferTriggerTiming(
            card.originalText,
            card.timing
          );
          const newTiming =
            correctTimings.length > 0 ? correctTimings[0] : "on_play";

          issues.push({
            file: filename,
            cardId: card.cardId,
            cardName: card.cardName,
            issue: "使用了旧格式的 timing",
            field: "trigger.timing",
            currentValue: currentTiming,
            suggestedValue: newTiming,
            fixed: true,
          });

          card.trigger.timing = newTiming;
        }
      }
    }

    // 检查 effects 中的 stat
    if (card.effects && Array.isArray(card.effects)) {
      card.effects.forEach((effect, index) => {
        if (effect.type === "stat_boost" && effect.stat) {
          const currentStat = effect.stat;

          // 检查是否是无效的 stat
          if (!validStats.includes(currentStat)) {
            const correctStats = inferStatFromText(card.originalText);

            if (correctStats.length > 0) {
              issues.push({
                file: filename,
                cardId: card.cardId,
                cardName: card.cardName,
                issue: "无效的 stat 字段",
                field: `effects[${index}].stat`,
                currentValue: currentStat,
                suggestedValue: correctStats[0],
                fixed: true,
              });

              effect.stat = correctStats[0];
            } else {
              issues.push({
                file: filename,
                cardId: card.cardId,
                cardName: card.cardName,
                issue: "无效的 stat 字段（无法自动修正）",
                field: `effects[${index}].stat`,
                currentValue: currentStat,
                fixed: false,
              });
            }
          } else {
            // stat 是有效值，但可能不正确
            const correctStats = inferStatFromText(card.originalText);
            if (
              correctStats.length > 0 &&
              !correctStats.includes(currentStat)
            ) {
              issues.push({
                file: filename,
                cardId: card.cardId,
                cardName: card.cardName,
                issue: "stat 字段可能不正确",
                field: `effects[${index}].stat`,
                currentValue: currentStat,
                suggestedValue: correctStats[0],
                fixed: true,
              });

              effect.stat = correctStats[0];
            }
          }
        }
      });
    }
  });

  return issues;
}

function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║        全面验证事件卡和角色卡                      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const files = [
    { path: "../public/skills/event_skills.json", name: "事件卡" },
    { path: "../public/skills/character_skills_烏野.json", name: "烏野角色卡" },
  ];

  const allIssues: ValidationIssue[] = [];

  files.forEach((fileInfo) => {
    const filePath = path.join(__dirname, fileInfo.path);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  文件不存在: ${fileInfo.name}`);
      return;
    }

    console.log(`\n📋 检查 ${fileInfo.name}...`);
    const data: SkillCard[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log(`   载入 ${data.length} 张卡片`);

    const issues = validateAndFix(data, fileInfo.name);
    allIssues.push(...issues);

    // 保存修正后的文件
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    console.log(`   发现问题: ${issues.length} 个`);
    console.log(`   已修正: ${issues.filter((i) => i.fixed).length} 个`);
  });

  // 显示所有问题
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║                  详细问题列表                       ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  if (allIssues.length === 0) {
    console.log("✅ 未发现任何问题！\n");
  } else {
    const fixedIssues = allIssues.filter((i) => i.fixed);
    const unfixedIssues = allIssues.filter((i) => !i.fixed);

    if (fixedIssues.length > 0) {
      console.log(`✅ 已修正 ${fixedIssues.length} 个问题:\n`);
      fixedIssues.forEach((issue, index) => {
        console.log(
          `${index + 1}. ${issue.file} - ${issue.cardName} (${issue.cardId})`
        );
        console.log(`   问题: ${issue.issue}`);
        console.log(`   字段: ${issue.field}`);
        console.log(
          `   修正: ${issue.currentValue} → ${issue.suggestedValue}\n`
        );
      });
    }

    if (unfixedIssues.length > 0) {
      console.log(`⚠️  需要人工处理 ${unfixedIssues.length} 个问题:\n`);
      unfixedIssues.forEach((issue, index) => {
        console.log(
          `${index + 1}. ${issue.file} - ${issue.cardName} (${issue.cardId})`
        );
        console.log(`   问题: ${issue.issue}`);
        console.log(`   字段: ${issue.field}`);
        console.log(`   当前值: ${issue.currentValue}\n`);
      });
    }
  }

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║                    总结                             ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");
  console.log(`总问题数: ${allIssues.length}`);
  console.log(`已修正: ${allIssues.filter((i) => i.fixed).length}`);
  console.log(`需人工处理: ${allIssues.filter((i) => !i.fixed).length}`);
  console.log("\n✨ 完成！");
}

main();
