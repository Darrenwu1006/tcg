/**
 * 遊戲引擎測試
 * 驗證引擎基礎功能是否正常運作
 */

import { GameEngine } from "./GameEngine";
import { createBalancedTestDeck } from "./TestHelpers";

/**
 * 測試 1：遊戲初始化
 */
function test1_Initialization() {
  console.log("\n=== 測試 1: 遊戲初始化 ===");

  const meDeck = createBalancedTestDeck();
  const opponentDeck = createBalancedTestDeck();

  const engine = new GameEngine(meDeck, opponentDeck, "me");
  const state = engine.getState();

  // 驗證
  console.log(`✓ 遊戲初始化成功`);
  console.log(`  - 我方手牌: ${state.me.hand.length} 張`);
  console.log(`  - 對手手牌: ${state.opponent.hand.length} 張`);
  console.log(`  - 我方 Set: ${state.me.set.length} 張`);
  console.log(`  - 對手 Set: ${state.opponent.set.length} 張`);
  console.log(`  - 當前階段: ${state.phase}`);
  console.log(`  - 發球權: ${state.servePlayer}`);

  // 檢查
  const assertions = {
    "手牌為 6 張":
      state.me.hand.length === 6 && state.opponent.hand.length === 6,
    "Set 區為 2 張":
      state.me.set.length === 2 && state.opponent.set.length === 2,
    初始階段為發球: state.phase === "serve",
    遊戲未結束: !state.gameOver,
  };

  Object.entries(assertions).forEach(([test, result]) => {
    console.log(`  ${result ? "✓" : "✗"} ${test}`);
  });

  return Object.values(assertions).every((v) => v);
}

/**
 * 測試 2：合法動作生成
 */
function test2_LegalActions() {
  console.log("\n=== 測試 2: 合法動作生成 ===");

  const meDeck = createBalancedTestDeck();
  const opponentDeck = createBalancedTestDeck();

  const engine = new GameEngine(meDeck, opponentDeck, "me");
  const legalActions = engine.getLegalActions("me");

  console.log(`✓ 生成 ${legalActions.length} 個合法動作`);
  console.log(`動作類型:`);

  const actionTypes = new Set(legalActions.map((a) => a.type));
  actionTypes.forEach((type) => {
    const count = legalActions.filter((a) => a.type === type).length;
    console.log(`  - ${type}: ${count} 個`);
  });

  return legalActions.length > 0;
}

/**
 * 測試 3：動作執行
 */
function test3_ActionExecution() {
  console.log("\n=== 測試 3: 動作執行 ===");

  const meDeck = createBalancedTestDeck();
  const opponentDeck = createBalancedTestDeck();

  const engine = new GameEngine(meDeck, opponentDeck, "me");

  // 獲取合法動作
  const legalActions = engine.getLegalActions();
  if (legalActions.length === 0) {
    console.log("✗ 沒有合法動作可執行");
    return false;
  }

  // 執行第一個動作
  const action = legalActions[0];
  console.log(`執行動作: ${action.type}`);

  const result = engine.executeAction(action);

  console.log(`結果: ${result.success ? "成功" : "失敗"}`);
  if (result.error) {
    console.log(`錯誤: ${result.error}`);
  }
  if (result.newPhase) {
    console.log(`新階段: ${result.newPhase}`);
  }

  return result.success;
}

/**
 * 測試 4：完整對局模擬
 */
function test4_FullGameSimulation() {
  console.log("\n=== 測試 4: 完整對局模擬 ===");

  const meDeck = createBalancedTestDeck();
  const opponentDeck = createBalancedTestDeck();

  const engine = new GameEngine(meDeck, opponentDeck, "me");

  console.log("開始隨機模擬對局...");
  const winner = engine.simulateToEnd(200);

  const state = engine.getState();
  console.log(`\n遊戲結果:`);
  console.log(`  - 回合數: ${state.turnCount}`);
  console.log(`  - 勝者: ${winner || "無（超過回合限制）"}`);
  console.log(`  - 遊戲結束: ${state.gameOver}`);
  console.log(`  - 我方 Set: ${state.me.set.length} 張`);
  console.log(`  - 對手 Set: ${state.opponent.set.length} 張`);

  // 顯示最後 10 條日誌
  console.log(`\n最後 10 條日誌:`);
  const logs = engine.getLogs();
  logs.slice(-10).forEach((log) => console.log(`  ${log}`));

  return state.gameOver || state.turnCount > 0;
}

/**
 * 測試 5：狀態克隆（MCTS 需求）
 */
function test5_StateCloning() {
  console.log("\n=== 測試 5: 狀態克隆 ===");

  const meDeck = createBalancedTestDeck();
  const opponentDeck = createBalancedTestDeck();

  const engine = new GameEngine(meDeck, opponentDeck, "me");

  // 克隆狀態
  const clonedState = engine.cloneState();
  const originalState = engine.getState();

  console.log("✓ 狀態已克隆");

  // 驗證獨立性
  console.log("驗證克隆獨立性...");

  const checks = {
    手牌數量相同: clonedState.me.hand.length === originalState.me.hand.length,
    但不是同一個陣列: clonedState.me.hand !== originalState.me.hand,
    階段相同: clonedState.phase === originalState.phase,
  };

  Object.entries(checks).forEach(([test, result]) => {
    console.log(`  ${result ? "✓" : "✗"} ${test}`);
  });

  return Object.values(checks).every((v) => v);
}

/**
 * 主測試函數
 */
export function runEngineTests() {
  console.log("╔════════════════════════════════════╗");
  console.log("║   遊戲引擎測試套件              ║");
  console.log("╚════════════════════════════════════╝");

  const tests = [
    { name: "遊戲初始化", fn: test1_Initialization },
    { name: "合法動作生成", fn: test2_LegalActions },
    { name: "動作執行", fn: test3_ActionExecution },
    { name: "完整對局模擬", fn: test4_FullGameSimulation },
    { name: "狀態克隆", fn: test5_StateCloning },
  ];

  const results: boolean[] = [];

  tests.forEach((test) => {
    try {
      const passed = test.fn();
      results.push(passed);
    } catch (error) {
      console.error(`\n✗ 測試失敗: ${test.name}`);
      console.error(error);
      results.push(false);
    }
  });

  // 總結
  console.log("\n╔════════════════════════════════════╗");
  console.log("║   測試結果                      ║");
  console.log("╚════════════════════════════════════╝");
  console.log(`通過: ${results.filter((r) => r).length} / ${results.length}`);
  console.log(`失敗: ${results.filter((r) => !r).length} / ${results.length}`);

  return results.every((r) => r);
}

// 直接執行測試
runEngineTests();
