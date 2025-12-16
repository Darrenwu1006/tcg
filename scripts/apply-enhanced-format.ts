/**
 * 应用增强格式修正
 * 根据验证报告自动修正15个问题
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function applyFixes() {
  // 加载文件
  const charPath = path.join(
    __dirname,
    "../public/skills/character_skills.json"
  );
  const eventPath = path.join(__dirname, "../public/skills/event_skills.json");

  const characters = JSON.parse(fs.readFileSync(charPath, "utf-8"));
  const events = JSON.parse(fs.readFileSync(eventPath, "utf-8"));

  let fixCount = 0;

  // 修正1: 及川徹 (HV-P01-033)
  const oikawa = characters.find((c: any) => c.cardId === "HV-P01-033");
  if (oikawa && oikawa.effects) {
    // 第一个效果：任意点数+1
    if (oikawa.effects[0]) {
      oikawa.effects[0].selector = "player";
      oikawa.effects[0].order = 1;
      fixCount++;
      console.log("✓ 修正: 及川徹 - 添加 selector: player (任意点数)");
    }

    // 第二个效果：对手丢牌
    if (oikawa.effects[1]) {
      oikawa.effects[1].selector = "opponent";
      oikawa.effects[1].from = "hand";
      oikawa.effects[1].visibility = "hidden";
      oikawa.effects[1].order = 2;
      fixCount++;
      console.log(
        "✓ 修正: 及川徹 - 添加 selector: opponent, visibility: hidden"
      );
    }
  }

  // 修正2-3: 影山飛雄 (HV-P01-006) - 頂和頂P
  characters.forEach((card: any) => {
    if (card.cardId === "HV-P01-006" && card.effects) {
      card.effects.forEach((effect: any, index: number) => {
        if (effect.type === "search") {
          effect.from = "deck_top";
          effect.to = "hand";
          effect.selector = "player";
          effect.optional = true;
          effect.visibility = "public";
          fixCount++;
        }
        if (effect.type === "discard") {
          effect.selector = "player";
          effect.from = "revealed";
          effect.to = "deck_bottom";
          fixCount++;
        }
      });
      console.log(`✓ 修正: 影山飛雄 (${card.rarity}) - 添加 from/to/selector`);
    }
  });

  // 修正4-5: 孤爪研磨 (HV-P01-018) - 頂和頂P
  characters.forEach((card: any) => {
    if (
      card.cardId === "HV-P01-018" &&
      card.effects &&
      card.effects.length > 1
    ) {
      // 假设第二个效果是检索
      if (card.effects[1]) {
        card.effects[1].type = "search";
        card.effects[1].from = "event";
        card.effects[1].to = "hand";
        card.effects[1].selector = "player";
        card.effects[1].optional = true;
        card.effects[1].order = 2;
        fixCount++;
        console.log(
          `✓ 修正: 孤爪研磨 (${card.rarity}) - 添加 optional: true, from/to`
        );
      }
    }
  });

  // 修正6: 日向・孤爪 (HV-P01-072)
  const hinataKenma = characters.find((c: any) => c.cardId === "HV-P01-072");
  if (hinataKenma && hinataKenma.effects && hinataKenma.effects[0]) {
    hinataKenma.effects[0].selector = "player";
    fixCount++;
    console.log("✓ 修正: 日向・孤爪 - 添加 selector: player (选择卡名)");
  }

  // 修正7: 赤葦京治 (HV-P01-045)
  const akaashi = characters.find((c: any) => c.cardId === "HV-P01-045");
  if (akaashi && akaashi.effects) {
    akaashi.effects.forEach((effect: any) => {
      if (effect.type === "discard") {
        effect.selector = "player";
        effect.from = "discard";
        effect.to = "hand";
        fixCount++;
      }
      if (
        effect.type === "search" ||
        (effect.type === "stat_boost" &&
          effect.value &&
          String(effect.value).includes("最多"))
      ) {
        effect.optional = true;
        fixCount++;
      }
    });
    console.log("✓ 修正: 赤葦京治 - 添加 selector 和 optional");
  }

  // 修正8: 入畑伸照 (HV-P01-085)
  const iribata = events.find((e: any) => e.cardId === "HV-P01-085");
  if (iribata && iribata.effects) {
    // 添加抽卡效果和点数增加效果的order
    iribata.effects.forEach((effect: any, index: number) => {
      effect.order = index + 1;
      if (effect.type === "search") {
        effect.from = "deck";
        effect.to = "hand";
        fixCount++;
      }
      if (effect.stat === "any") {
        effect.selector = "player";
        effect.duration = "turn";
        fixCount++;
      }
    });
    console.log("✓ 修正: 入畑伸照 - 添加 from/to/selector/duration");
  }

  // 修正9: 俺も思った☆ (HV-P01-087)
  const oremo = events.find((e: any) => e.cardId === "HV-P01-087");
  if (oremo && oremo.effects) {
    // 需要添加缺失的效果
    if (oremo.effects.length < 3) {
      // 重建完整的effects数组
      oremo.effects = [
        {
          type: "draw",
          amount: 1,
          order: 1,
        },
        {
          type: "stat_boost",
          target: "self",
          stat: "toss",
          value: 1,
          filter: "及川徹",
          order: 2,
        },
        {
          type: "special",
          subtype: "restrict",
          value: "对手以抽卡以外方式加入手牌时必须丢1张",
          duration: "next_opponent_turn",
          order: 3,
        },
      ];
      fixCount += 3;
      console.log("✓ 修正: 俺も思った☆ - 添加缺失的3个效果");
    }
  }

  // 修正10-11: 開放式進攻 (HV-P01-078) - S和SP
  events.forEach((card: any) => {
    if (card.cardId === "HV-P01-078") {
      // 重建完整的effects
      card.effects = [
        {
          type: "draw",
          amount: 2,
          order: 1,
        },
        {
          type: "discard",
          target: "self",
          amount: 1,
          selector: "player",
          from: "hand",
          order: 2,
        },
        {
          type: "special",
          subtype: "summon",
          value: "从弃牌区登场日向翔陽到攻击区",
          from: "discard",
          to: "attack",
          filter: "日向翔陽",
          amount: 1,
          selector: "player",
          condition: "事件區開放式進攻<=2",
          order: 3,
        },
        {
          type: "stat_boost",
          target: "self",
          stat: "attack",
          value: 1,
          order: 4,
        },
      ];
      fixCount += 4;
      console.log(`✓ 修正: 開放式進攻 (${card.rarity}) - 重建完整的4个效果`);
    }
  });

  // 保存文件
  fs.writeFileSync(charPath, JSON.stringify(characters, null, 2));
  fs.writeFileSync(eventPath, JSON.stringify(events, null, 2));

  return fixCount;
}

function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║        应用增强格式修正                            ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const fixCount = applyFixes();

  console.log("\n" + "=".repeat(60));
  console.log(`✨ 完成！共应用 ${fixCount} 处修正`);
  console.log("=".repeat(60));
}

main();
