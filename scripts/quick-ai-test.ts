/**
 * 快速 AI 測試
 */

import { GameEngine } from "../src/engine/GameEngine";
import { HeuristicAI } from "../src/engine/HeuristicAI";
import { initializeSkills } from "../src/engine/SkillLoader";

async function quickTest() {
  await initializeSkills();

  const deck = Array(40)
    .fill(null)
    .map((_, i) => ({
      id: "HV-P01-001",
      name: "Test " + i,
      instanceId: "inst-" + i,
      type: "CHARACTER" as const,
      stats: { serve: 3, block: 2, receive: 2, toss: 1, attack: 2 },
    }));

  const engine = new GameEngine([...deck], [...deck], "me");
  const ai = new HeuristicAI(0.1);

  console.log("快速測試 20 步...\n");
  for (let i = 0; i < 20; i++) {
    const state = engine.getState();
    const action = ai.selectAction(state, state.turnPlayer);
    console.log("[" + i + "] " + state.phase + " -> " + action.type);
    const result = engine.executeAction(action);
    if (!result.success) {
      console.log("  失敗:", result.error);
      break;
    }
    if (engine.isGameOver()) {
      console.log("遊戲結束！");
      break;
    }
  }
  console.log("\n完成！");
}

quickTest();
