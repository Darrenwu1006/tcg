/**
 * 关键卡片验证工具
 * 自动检查 15 张关键卡片的技能解析准确性
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ValidationIssue {
  cardId: string;
  cardName: string;
  severity: "critical" | "warning" | "info";
  issue: string;
  suggestion?: string;
}

// 关键卡片ID列表
const CRITICAL_CARDS = [
  "HV-P01-033", // 及川徹 頂
  "HV-P01-002", // 日向翔陽 頂
  "HV-P01-006", // 影山飛雄 頂
  "HV-P01-018", // 孤爪研磨 頂
  "HV-P01-021", // 黑尾鐵朗 頂
  "HV-P01-008", // 月島螢 S
  "HV-P01-087", // 俺も思った☆
  "HV-P01-077", // 拼命向前衝
  "HV-P01-078", // 開放式進攻
  "HV-P01-085", // 入畑伸照
  "HV-D01-005", // 西谷夕
  "HV-D01-007", // 縁下力
  "HV-P01-043", // 木兎光太郎
  "HV-P01-045", // 赤葦京治
  "HV-P01-072", // 日向・孤爪
];

function validateCard(card: any): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!card.parsed) {
    issues.push({
      cardId: card.cardId,
      cardName: card.cardName,
      severity: "critical",
      issue: "卡片解析失败",
    });
    return issues;
  }

  // 检查1: 对手效果缺少 selector
  card.effects?.forEach((effect: any, index: number) => {
    if (effect.target === "opponent" && effect.type !== "stat_boost") {
      if (!effect.selector) {
        issues.push({
          cardId: card.cardId,
          cardName: card.cardName,
          severity: "warning",
          issue: `效果${index + 1}影响对手，但缺少selector字段`,
          suggestion: '添加 "selector": "opponent" 或 "player"',
        });
      }
    }
  });

  // 检查2: discard 效果应该有 selector
  card.effects?.forEach((effect: any, index: number) => {
    if (effect.type === "discard" && !effect.selector) {
      issues.push({
        cardId: card.cardId,
        cardName: card.cardName,
        severity: "warning",
        issue: `效果${index + 1}为discard，但缺少selector`,
        suggestion: "指定谁选择要丢弃的卡片",
      });
    }
  });

  // 检查3: search/检索效果应该有详细信息
  card.effects?.forEach((effect: any, index: number) => {
    if (effect.type === "search" && !effect.from) {
      issues.push({
        cardId: card.cardId,
        cardName: card.cardName,
        severity: "info",
        issue: `效果${index + 1}为search，缺少from字段`,
        suggestion: "指定从哪里检索（deck/discard/field等）",
      });
    }
  });

  // 检查4: 原文包含"选择"但缺少selector
  if (
    card.originalText.includes("選擇") ||
    card.originalText.includes("选择")
  ) {
    const hasSelector = card.effects?.some((e: any) => e.selector);
    if (!hasSelector) {
      issues.push({
        cardId: card.cardId,
        cardName: card.cardName,
        severity: "warning",
        issue: "原文包含「選擇」但effects中缺少selector",
        suggestion: "检查是否需要添加selector字段",
      });
    }
  }

  // 检查5: 原文包含"最多"表示可选
  if (card.originalText.includes("最多")) {
    const hasOptional = card.effects?.some((e: any) => e.optional);
    if (!hasOptional) {
      issues.push({
        cardId: card.cardId,
        cardName: card.cardName,
        severity: "info",
        issue: "原文包含「最多」但effects中缺少optional",
        suggestion: '考虑添加 "optional": true',
      });
    }
  }

  // 检查6: 多重效果检查
  const effectsInText = [
    card.originalText.includes("抽") || card.originalText.includes("draw"),
    card.originalText.includes("點數") && card.originalText.includes("+"),
    card.originalText.includes("棄") || card.originalText.includes("丟"),
    card.originalText.includes("登場"),
  ].filter(Boolean).length;

  const actualEffects = card.effects?.length || 0;

  if (effectsInText > actualEffects + 1) {
    issues.push({
      cardId: card.cardId,
      cardName: card.cardName,
      severity: "warning",
      issue: `原文可能包含${effectsInText}个效果，但只解析了${actualEffects}个`,
      suggestion: "检查是否遗漏效果",
    });
  }

  return issues;
}

function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║        关键卡片技能验证工具                        ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 加载卡片数据
  const characterPath = path.join(
    __dirname,
    "../public/skills/character_skills.json"
  );
  const eventPath = path.join(__dirname, "../public/skills/event_skills.json");

  const characters = JSON.parse(fs.readFileSync(characterPath, "utf-8"));
  const events = JSON.parse(fs.readFileSync(eventPath, "utf-8"));

  const allCards = [...characters, ...events];

  // 筛选关键卡片
  const criticalCards = allCards.filter((card) =>
    CRITICAL_CARDS.includes(card.cardId)
  );

  console.log(`📋 共载入 ${allCards.length} 张卡片`);
  console.log(`🎯 检查 ${criticalCards.length} 张关键卡片\n`);

  // 验证每张卡片
  const allIssues: ValidationIssue[] = [];

  criticalCards.forEach((card) => {
    const issues = validateCard(card);

    if (issues.length > 0) {
      console.log(`\n📌 ${card.cardName} (${card.cardId})`);
      console.log(`   原文: ${card.originalText.substring(0, 60)}...`);

      issues.forEach((issue) => {
        const icon =
          issue.severity === "critical"
            ? "❌"
            : issue.severity === "warning"
            ? "⚠️"
            : "ℹ️";
        console.log(`   ${icon} ${issue.issue}`);
        if (issue.suggestion) {
          console.log(`      建议: ${issue.suggestion}`);
        }
      });

      allIssues.push(...issues);
    } else {
      console.log(`✅ ${card.cardName} (${card.cardId}) - 无明显问题`);
    }
  });

  // 统计
  console.log("\n\n╔════════════════════════════════════════════════════════╗");
  console.log("║                    验证总结                         ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const critical = allIssues.filter((i) => i.severity === "critical").length;
  const warnings = allIssues.filter((i) => i.severity === "warning").length;
  const info = allIssues.filter((i) => i.severity === "info").length;

  console.log(`总问题数: ${allIssues.length}`);
  console.log(`  ❌ 严重: ${critical}`);
  console.log(`  ⚠️  警告: ${warnings}`);
  console.log(`  ℹ️  提示: ${info}`);

  // 保存报告
  const reportPath = path.join(
    __dirname,
    "../docs/skill_validation_report.json"
  );
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalCards: criticalCards.length,
        issues: allIssues,
        summary: { critical, warnings, info },
      },
      null,
      2
    )
  );

  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  console.log("\n✨ 验证完成！");
}

main();
