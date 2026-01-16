/**
 * Debug 事件卡執行
 */

import { GameEngine } from "../src/engine/GameEngine";
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
  const state = engine.getState();

  console.log("=== 初始狀態 ===");
  console.log("階段:", state.phase);
  console.log("手牌:", state.me.hand.length);
  const eventCards = state.me.hand.filter((c) => c.type === "EVENT");
  console.log("事件卡:", eventCards.length);

  // 取得合法動作
  const actions = engine.getLegalActions();
  console.log("合法動作:", actions.length);
  const eventActions = actions.filter((a) => a.type === "USE_EVENT");
  console.log("USE_EVENT:", eventActions.length);

  // 如果有 USE_EVENT，執行它
  if (eventActions.length > 0) {
    const action = eventActions[0];
    console.log("\n=== 執行 USE_EVENT ===");
    console.log("動作:", JSON.stringify(action));

    const result = engine.executeAction(action);
    console.log("結果:", result);

    const newState = engine.getState();
    console.log("\n=== 執行後狀態 ===");
    console.log("階段:", newState.phase);
    console.log("手牌:", newState.me.hand.length);
    const newEventCards = newState.me.hand.filter((c) => c.type === "EVENT");
    console.log("事件卡:", newEventCards.length);
    console.log("棄牌區:", newState.me.drop.length);

    // 再次取得合法動作
    const newActions = engine.getLegalActions();
    const newEventActions = newActions.filter((a) => a.type === "USE_EVENT");
    console.log("新 USE_EVENT:", newEventActions.length);
  } else {
    console.log(
      "\n沒有 USE_EVENT 動作可用（正常，因為 serve 階段事件卡時機不符）"
    );
  }
}

test();
