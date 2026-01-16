/**
 * Debug AI 對戰循環問題
 */

import { GameEngine } from "../src/engine/GameEngine";
import { HeuristicAI } from "../src/engine/HeuristicAI";
import { initializeSkills } from "../src/engine/SkillLoader";

async function test() {
  await initializeSkills();

  // 建立簡單的測試牌組
  const deck = Array(40)
    .fill(null)
    .map((_, i) => {
      if (i < 4) {
        return {
          id: "HV-P01-088",
          name: "お前達は 強いよ",
          instanceId: `event-${i}`,
          type: "EVENT" as const,
          stats: {
            serve: null,
            block: null,
            receive: null,
            toss: null,
            attack: null,
          },
        };
      }
      return {
        id: "HV-P01-001",
        name: "Test Char " + i,
        instanceId: `char-${i}`,
        type: "CHARACTER" as const,
        stats: { serve: 3, block: 2, receive: 2, toss: 1, attack: 2 },
      };
    });

  const engine = new GameEngine([...deck], [...deck], "me");
  const ai = new HeuristicAI(0);

  console.log("=== 模擬 10 步 AI 對戰 ===\n");

  for (let i = 0; i < 10; i++) {
    const state = engine.getState();
    const currentPlayer = state.turnPlayer;
    const actions = engine.getLegalActions();

    console.log(`[步驟 ${i + 1}] 階段=${state.phase}, 玩家=${currentPlayer}`);
    console.log(`  合法動作: ${actions.length} 個`);

    // 顯示動作類型分佈
    const actionTypes = new Map<string, number>();
    for (const a of actions) {
      actionTypes.set(a.type, (actionTypes.get(a.type) || 0) + 1);
    }
    console.log(
      `  類型: ${[...actionTypes.entries()]
        .map(([k, v]) => `${k}:${v}`)
        .join(", ")}`
    );

    // AI 選擇動作
    const action = ai.selectAction(state, currentPlayer);
    console.log(`  選擇: ${action.type}`);

    // 執行動作
    const result = engine.executeAction(action);
    console.log(`  結果: ${result.success ? "成功" : "失敗: " + result.error}`);

    const newState = engine.getState();
    console.log(`  新階段: ${newState.phase}`);
    console.log("");

    if (engine.isGameOver()) {
      console.log("遊戲結束！");
      break;
    }
  }
}

test();
