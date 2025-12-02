## devSpec

#### Pending / Next Steps (待完成 / 下一步)

- **Card List Format Update**:
  - Update card list format, adding role fields and card number.
  - Devide character card and event card to different csv files. Each school has it's own folder.
- **Start Phase Logic**:
  - Implement "Block/Receive" selection phase.
  - 攻擊攔網按鈕點選後，自動切換到對手視角。
  - Enforce game flow phases (Draw -> Main -> Battle).
- **UI Refinements**:
  - Integrate Coin Toss UI.
  - Improve phase indicators and valid action highlighting (Red box for valid moves).
  - 洗牌按鈕放到 Deck Draw 下方
  - reset 按鈕改成 back：返回上一個動作，可能打錯卡。
- **內容檢索**:
  - 可以檢查場上 guts 內容（發球、事件、接球、舉球、攻擊、攔網），點擊後展開，要顯示當前數量（有多少張卡堆疊在上面）。
  - 可以檢查棄牌區內容，點擊後展開
  - 牌組剩餘張數統計，點選後顯示當前牌組中的卡牌數量統計，方便我練習資源控制。右鍵點擊牌組開啟，顯示區域是 card-detail-panel。

#### Execution Plan (執行計劃)

- 對戰沙盒
  - 流程
    - 進入畫面（Setup Overlay）：
      - 蓋板介面，阻擋進入對戰畫面
      - 選擇對戰組合：
        - 我方：匯入 CSV 或選擇預設（預設：青葉極簡軸）
        - 對方：匯入 CSV 或選擇預設
      - 先後攻決定：
        - 骰子/硬幣按鈕：隨機決定
        - 手動選擇：指定先攻/後攻
      - [Start Game] 按鈕：進入對戰畫面，執行自動化流程
    - 對戰起始 setting：
      - 自動洗牌
      - 自動抽 6 張起始手牌
      - 自動放置 2 張 Set 卡
      - 提示是否調度手牌 (Mulligan)
    - 對戰進行：
      - 以沙盒模式進行，可以出現提示但不要強硬鎖動作。例如卡牌打出的時機錯誤出現紅框。
      - 嚴格遵守遊戲各階段流程，讓我可以熟悉遊戲各流程，完成後才可以去下一個動作。
        - 要顯示該流程資訊
        - 該流程中可以打出的卡出現紅筐
  - 對戰環境介面規劃
    - 下一回合：就會是介面直接反轉
    - 抽卡：
      - 手牌顯示：
        - 根據 Store 資料渲染手牌
        - 卡片樣式：顯示名稱、數值、類型（角色/事件）
        - 互動：Hover 放大，右鍵點擊（Right-Click）開啟詳情側邊欄
      - 卡片詳情側邊欄：
        - 右鍵點擊卡片時，右側滑出彈窗顯示完整技能描述
      - 卡背樣式：
        - 根據學校顯示對應顏色與名稱（青城：青綠，烏野：橘色）
    - 切換視角，已完成。
    - 放棄：重新回到 set 開始流程與自動佈局，補手牌回六張，提示拿取 set 卡
    - 丟棄手牌:未來點選手牌在點擊或是拖拉到氣牌區即可
    - 洗牌
    - 牌按照順序放回牌底：在特定技能或是事件卡出來可以發動
    - 數值計算器（自動計算可手動修改）
    - 對戰佈局
      - 發球：長壓或雙擊彈出 guts 資訊
      - 接球：長壓或雙擊彈出 guts 資訊
      - 舉球：長壓或雙擊彈出 guts 資訊
      - 攻擊：長壓或雙擊彈出 guts 資訊
      - 攔網：長壓或雙擊彈出 guts 資訊
      - 牌組區：可顯示牌庫現在的數量
      - 事件區：長壓或雙擊彈出 guts 資訊
      - 棄牌區：長壓或是雙擊會彈出棄牌區資訊
      - 彈出資訊從所屬的區域放大框體顯示，再次點擊任何地方就縮回去
  - 卡牌資訊顯示匡，詳細資訊
  - 流程資訊與提示
  - 縮圖卡牌顯示資訊
    <!-- - 牌庫與牌組系統 -->
      <!-- - 牌庫
        - 讀卡池資料夾路徑
        - 要思考卡片的樣式與資訊內容呈現方式
        - 新增 編輯 牌組功能（不要做刪除，讀牌組的資料夾路徑） -->
  - 牌組，統一用 csv 檔案匯入與修改，本地處理

---

### 技術架構與開發規劃 (Technical Plan)

**核心技術棧**:

- **Framework**:無，但是用 ts 撰寫，架設在 vite 上
- **Styling**: css，方便我修改
- **State Management**: 你推薦

---

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
