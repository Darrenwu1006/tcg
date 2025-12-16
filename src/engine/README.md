# 遊戲引擎 - 使用說明

## 📁 目錄結構

```
src/engine/
├── Actions.ts          # 動作類型定義
├── GameState.ts        # 遊戲狀態管理
├── RuleValidator.ts    # 規則驗證器
├── ActionExecutor.ts   # 動作執行器
├── GameEngine.ts       # 主遊戲引擎
└── EngineTests.ts      # 測試套件
```

## 🎮 基本使用

### 創建遊戲引擎

```typescript
import { GameEngine } from "./src/engine/GameEngine";
import { CardDatabase } from "./src/data/CardDatabase";

// 準備牌組
const db = CardDatabase.getInstance();
const meDeck = db.getAllCards().slice(0, 40); // 取前 40 張卡
const opponentDeck = db.getAllCards().slice(0, 40);

// 創建引擎
const engine = new GameEngine(meDeck, opponentDeck, "me");
```

### 獲取合法動作

```typescript
const legalActions = engine.getLegalActions();

console.log(`有 ${legalActions.length} 個合法動作`);
legalActions.forEach((action) => {
  console.log(action.type);
});
```

### 執行動作

```typescript
const action = legalActions[0];
const result = engine.executeAction(action);

if (result.success) {
  console.log("動作執行成功！");
  console.log(`新階段: ${result.newPhase}`);
} else {
  console.log(`錯誤: ${result.error}`);
}
```

### 檢查遊戲狀態

```typescript
const state = engine.getState();

console.log(`當前階段: ${state.phase}`);
console.log(`回合玩家: ${state.turnPlayer}`);
console.log(`我方手牌: ${state.me.hand.length} 張`);
console.log(`對手手牌: ${state.opponent.hand.length} 張`);
console.log(`遊戲結束: ${engine.isGameOver()}`);
```

### 完整對局模擬

```typescript
// 隨機模擬到遊戲結束
const winner = engine.simulateToEnd(200); // 最多 200 回合

console.log(`勝者: ${winner}`);

// 查看日誌
const logs = engine.getLogs();
logs.forEach((log) => console.log(log));
```

## 🧪 運行測試

### 方法 1：直接運行測試文件

```bash
# 使用 ts-node
npx ts-node src/engine/EngineTests.ts
```

### 方法 2：使用測試腳本

```bash
npx ts-node scripts/test-engine.ts
```

## 📊 測試項目

測試套件包含以下測試：

1. **遊戲初始化測試**

   - 驗證手牌數量（6 張）
   - 驗證 Set 區（2 張）
   - 驗證初始階段

2. **合法動作生成測試**

   - 確認能生成合法動作
   - 檢查動作類型正確性

3. **動作執行測試**

   - 驗證動作能正確執行
   - 檢查狀態變更

4. **完整對局模擬測試**

   - 測試遊戲能玩到結束
   - 驗證勝負判定

5. **狀態克隆測試**
   - 驗證狀態能正確克隆
   - 確保克隆獨立性（MCTS 需求）

## 🔧 API 參考

### GameEngine

#### 構造函數

```typescript
new GameEngine(meDeck: Card[], opponentDeck: Card[], firstPlayer: Player)
```

#### 主要方法

- `getState()`: 獲取當前遊戲狀態（只讀）
- `cloneState()`: 克隆當前狀態（用於 MCTS）
- `getLegalActions(player?)`: 獲取合法動作列表
- `isActionLegal(action, player?)`: 檢查動作是否合法
- `executeAction(action, player?)`: 執行動作
- `isGameOver()`: 檢查遊戲是否結束
- `getWinner()`: 獲取勝者
- `getCurrentPlayer()`: 獲取當前回合玩家
- `getLogs()`: 獲取遊戲日誌
- `simulateToEnd(maxTurns)`: 隨機模擬到結束

## ⚠️ 已知限制

### 未實現功能

1. **技能系統**

   - 所有卡片技能效果未實現
   - 保留到 Phase 3（使用 LLM 處理）

2. **事件卡**

   - 事件卡使用邏輯未實現

3. **複雜規則**
   - 特殊機制（虛攻、銅牆鐵壁等）
   - 持續效果

### 當前實現範圍

引擎當前**只實現基礎規則**：

- ✅ 發球階段
- ✅ 防守選擇（攔網 vs 接球）
- ✅ 攔網階段（1-3 張卡）
- ✅ 接球軸（接球 → 托球 → 攻擊）
- ✅ 點數計算（OP/DP）
- ✅ 勝負判定
- ✅ Lost 流程（Interval）
- ✅ 名稱重複限制

## 🚀 下一步

1. **運行測試** - 確認引擎正確性
2. **Phase 3** - 實現 LLM 技能處理系統
3. **Phase 4** - 開發 AI（啟發式 / MCTS）
4. **Phase 5** - 組牌優化

## 📝 使用範例

查看 `EngineTests.ts` 中的完整測試範例。

## 🤝 貢獻

這是 AI 開發專案的一部分。如有問題或建議，請更新 `AI_DEVELOPMENT_LOG.md`。
