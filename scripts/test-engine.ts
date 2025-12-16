/**
 * 引擎測試運行器
 * 用於快速測試遊戲引擎
 *
 * 運行方式：
 * ts-node scripts/test-engine.ts
 * 或
 * npm run test:engine
 */

// 注意：這是一個簡單的測試腳本
// 實際運行時可能需要調整路徑

import("../src/engine/EngineTests")
  .then((module) => {
    const { runEngineTests } = module;

    console.log("開始測試遊戲引擎...\n");

    const allPassed = runEngineTests();

    if (allPassed) {
      console.log("\n🎉 所有測試通過！");
      process.exit(0);
    } else {
      console.log("\n❌ 有測試失敗");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("測試運行失敗:", error);
    process.exit(1);
  });
