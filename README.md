# tcg

---

## Development Progress Logs

### Progress Log (2025-12-05)

#### Completed (已完成)

- **TypeScript Code Optimization (TypeScript 代碼優化)**:

  - **Data Structure Unification (數據結構統一)**:
    - 創建統一的 `Stats` 和 `CardStats` 介面，提升類型安全
    - 移除未使用的 `AppState.count` 屬性
  - **renderBlockBar Refactoring (renderBlockBar 重構)**:
    - 提取重複代碼到 `src/utils/renderHelpers.ts`
    - 統一使用 `maxBlocks=6`
    - null 值顯示為 "-" 而非 "0"，提升數據可讀性
  - **School Mapping Centralization (學校映射集中化)**:
    - 創建 `src/constants/schools.ts` 集中管理學校名稱映射
    - 提供 `getSchoolClass()`, `getSchoolName()` 等輔助函數

- **UI Improvement (UI 改進)**:
  - **Card Stats Display (卡片統計顯示)**:
    - 卡片能力值為 null 時，數值文字顯示 "-" 而非 "0"
    - 空心方塊保持未填色狀態，更清楚表示該卡片沒有此屬性

### Progress Log (2025-12-04)

#### Completed (已完成)

- **School Mapping Refactor (學校映射重構)**:
  - **Centralized Constants**: 創建 `src/constants/schools.ts` 集中管理學校名稱映射。
  - **Type Safety**: 新增 TypeScript 類型定義 (`SchoolNameZh`, `SchoolClass`)，提升類型安全。
  - **Helper Functions**: 提供 `getSchoolClass()`, `getSchoolName()`, `isValidSchoolName()` 輔助函數。
  - **Code Deduplication**: 移除 `Card.ts` 中的重複映射邏輯，改用共用常量。
  - **Maintainability**: 新增學校時只需更新一個文件，避免遺漏。

### Progress Log (2025-12-04)

#### Completed (已完成)

- **Card Back Display Fix (卡背顯示修復)**:

  - **Manual DOM Construction**: 修復了 Deck 區域卡背顯示問題，改用手動 DOM 構建方式 (createElement) 以避免 HTML 解析錯誤。
  - **Visual Verification**: 確認烏野 (Karasuno) 橙色卡背正確顯示。

- **Drop Area Improvements (棄牌區優化)**:
  - **Face-up Display**: 將 Drop 區域改為正面顯示卡片 (Face-up)，與 Serve/Receive 區域一致。
  - **Structure Alignment**: 移除 `.card-stack` 容器，直接渲染卡片並添加 `.stack-count` 計數標記，統一樣式結構。

### Progress Log (2025-12-02)

#### Completed (已完成)

- **Expanded Stack View (堆疊展開視圖)**:

  - **全域拖曳選取 (Global Drag Selection)**: 支援跨區域（手牌 + 展開視圖）的拖曳選取。
  - **多卡移動 (Multi-Card Movement)**: 支援一次移動多張選取的卡片。
  - **堆疊視覺化**: 區分 Active Unit (最上層) 與 Guts (堆疊內容)。
  - **跨玩家查看**: 支援點擊對手堆疊查看內容（唯讀模式）。
  - **動態定位與旋轉**:
    - 我方視角：展開我方堆疊在上方，展開對手堆疊在下方。
    - 對手視角：展開對手堆疊在上方，展開我方堆疊在下方。
    - 修正旋轉問題，Overlay 永遠保持正向（Upright）。
  - **全域 Overlay 重構**: 將 Overlay 移至 `body` 層級，解決旋轉與定位問題。

- **Deck & Drop Visuals (牌庫與棄牌區視覺)**:

  - 若區域內有卡片，顯示該校專屬卡背。
  - 修正 Deck Slot 事件監聽器重複問題。

- **Deck Info Panel (牌庫資訊面板)**:

  - **右鍵點擊牌庫**: 開啟側邊欄顯示牌庫清單。
  - **UI 優化**:
    - 顯示欄位：卡片資訊 (名稱 + 稀有度 + ID)、總數 (Total)、剩餘 (Rem.)。
    - 樣式調整：文字全部靠左對齊，ID 顯示為灰色小字。

- **Touch Support (觸控支援)**:

  - **Touch Drag Selection**: 支援觸控拖曳選取卡片。
  - **Long Press Interaction**: 支援長按 (500ms) 模擬右鍵點擊，顯示卡片詳情。
  - **Double Tap Interaction**: 支援雙擊 (Double Tap) 模擬右鍵點擊，顯示卡片詳情。
  - **Separate Stats Reset**: 實作分開的「重置我方」與「重置對手」按鈕，並將按鈕移至對應面板下方，方便獨立控制數值。
  - **Stats Panel Layout**: 調整 Stats Panel 佈局，增加 Game Log 區域佔比至 40%，並縮減上方統計區間距。
  - **Shuffle & Logging**: 實作洗牌功能與按鈕，並增加洗牌、抽牌、重置數值的 Game Log 記錄。

- **Deployment (部署)**:
  - **GitHub Pages**: 成功部署至 GitHub Pages。
  - **Deployment Guide**: 建立 `DEPLOYMENT.md` 說明部署流程。

### Progress Log (2025-12-01)

#### Completed (已完成)

- **Deck Import & Management**:
  - Imported Fukurodani deck and card pool.
  - Verified CSV format correctness.
  - Cleaned up deck selection dropdown (Removed Nekoma/Karasuno).
- **UI/Layout Fixes**:
  - Fixed "Load Defaults" and "Start Game" button alignment in SetupOverlay.
- **Debugging**:
  - Resolved deck loading issues.

### Progress Log (2025-11-30)

#### Completed (已完成)

- **Stats Panel**:
  - Implemented dual counters (Attack/Defense) for Me/Opponent.
  - Added "Reset All Stats" button.
- **Card Data**:
  - Added Rarity and Role fields handling.
  - Implemented Null stats ("-") logic.
- **Card Management**:
  - Implemented "Return to Deck" and "Discard" interactions via slot clicking.
- **Visualization**:
  - Implemented Face-down cards for Deck and Set areas.
  - Implemented School-specific card backs (Seijoh/Karasuno).
  - Implemented Hand visibility logic (hide opponent's hand face-down).
  - Fixed card orientation (always upright).
  - Swapped opponent's containers back (Deck/Drop on Left).
- **Interaction**:
  - Implemented Draw button logic.
  - Enabled Right-click details for field cards.
  - Implemented Horizontal Set area layout with "Add to Hand" interaction.
  - Enabled Full Opponent Interaction (Draw, Play, Move, Set) when viewing their perspective.

---
