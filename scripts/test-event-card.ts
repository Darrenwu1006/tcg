/**
 * 測試事件卡是否可在接球階段使用
 */

import { getEventSkill, initializeSkills } from "../src/engine/SkillLoader";
import { matchesTiming } from "../src/engine/SkillTriggerSystem";
import { canPayCost } from "../src/engine/CostChecker";
import { createInitialGameState } from "../src/engine/GameState";

// 先載入技能
await initializeSkills();

const skill = getEventSkill("HV-P01-088");
if (skill) {
  console.log("=== 事件卡測試: お前達は 強いよ ===");
  console.log("卡片ID:", skill.cardId);
  console.log("卡名:", skill.cardName);
  console.log("時機:", skill.timing);
  console.log("費用類型:", skill.cost.type);
  console.log("費用數量:", skill.cost.amount, typeof skill.cost.amount);

  console.log("\n=== 時機匹配測試 ===");
  console.log(
    "matchesTiming('接球', 'receive'):",
    matchesTiming("接球", "receive")
  );
  console.log(
    "matchesTiming(skill.timing, 'receive'):",
    matchesTiming(skill.timing, "receive")
  );
  console.log(
    "matchesTiming(skill.timing, 'serve'):",
    matchesTiming(skill.timing, "serve")
  );

  console.log("\n=== 費用支付測試 ===");
  const mockCards = [];
  for (let i = 0; i < 40; i++) {
    mockCards.push({
      id: "card-" + i,
      name: "Test " + i,
      instanceId: "inst-" + i,
      type: "CHARACTER" as const,
      stats: { serve: 3, block: 2, receive: 2, toss: 1, attack: 2 },
    });
  }

  const state = createInitialGameState(mockCards, mockCards, "me");
  console.log("手牌數量:", state.me.hand.length);
  console.log("canPayCost:", canPayCost(state, "me", skill.cost));
} else {
  console.log("⚠️ 技能未找到 - 請確認 event_skills.json 是否存在 HV-P01-088");
}
