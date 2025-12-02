# tcg

---

## Development Progress Logs

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
