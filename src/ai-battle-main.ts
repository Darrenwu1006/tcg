/**
 * AI Battle Main Entry Point
 * AI 對戰主入口 - 獨立頁面版本 (v2)
 *
 * 優化版本：
 * - 蓋板式設定面板（開始前全螢幕，開始後隱藏）
 * - 控制面板移到右下角
 * - 攻守交換時自動切換視角
 * - 整合日誌到 Game Log
 */

import "./style.css";
import "./ai-battle.css";
import { Store, AppState } from "./state/Store";
import { GameBoard } from "./components/GameBoard";
import { CardDetailPanel } from "./components/CardDetailPanel";
import { AIBattleControls, PlaybackState } from "./components/AIBattleControls";
import { AIBattleSetup, AIBattleConfig } from "./components/AIBattleSetup";
import { AIBattleService, BattleStep } from "./services/AIBattleService";
import { loadDeck, getDeckSchool } from "./services/DeckLoader";
import { initializeSkills } from "./engine/SkillLoader";

// 應用狀態
class AIBattleApp {
  private store: Store<AppState>;
  private battleService: AIBattleService;
  private controls: AIBattleControls;
  private setup: AIBattleSetup;
  private gameBoard: GameBoard;
  private detailPanel: CardDetailPanel;

  // DOM 元素
  private appElement: HTMLDivElement | null = null;
  private setupOverlay: HTMLElement | null = null;
  private gameContainer: HTMLElement | null = null;
  private opDpPanel: HTMLElement | null = null;

  private playbackState: PlaybackState = "idle";
  private playbackInterval: number | null = null;
  private currentConfig: AIBattleConfig;
  private isInitialized = false;
  private lastTurnPlayer: "me" | "opponent" = "me";

  constructor() {
    // 初始狀態
    const initialState: AppState = {
      viewPerspective: "me",
      gamePhase: "setup",
      firstPlayer: null,
      selectedCard: null,
      playingCard: null,
      me: {
        deck: [],
        hand: [],
        set: [],
        drop: [],
        field: [],
        school: "seijoh",
      },
      opponent: {
        deck: [],
        hand: [],
        set: [],
        drop: [],
        field: [],
        school: "fukurodani",
      },
      logs: [],
      turnPlayer: "me",
      phase: "draw",
      battleState: {
        isAttacking: false,
        defenseChoice: "none",
        attacker: null,
      },
      winCount: { me: 0, opponent: 0 },
      selectedCards: [],
      matchWinner: null,
    };

    this.store = new Store<AppState>(initialState);
    this.battleService = new AIBattleService();

    // 建立控制面板
    this.controls = new AIBattleControls({
      onStart: () => this.handleStart(),
      onPause: () => this.handlePause(),
      onResume: () => this.handleResume(),
      onNextStep: () => this.handleNextStep(),
      onReset: () => this.handleReset(),
      onSpeedChange: (speed) => this.handleSpeedChange(speed),
    });

    // 建立設定面板
    this.setup = new AIBattleSetup({
      onConfigChange: (config) => this.handleConfigChange(config),
    });
    this.currentConfig = this.setup.getConfig();

    // 建立遊戲面板（複用現有組件）
    this.gameBoard = new GameBoard(this.store);
    this.detailPanel = new CardDetailPanel(this.store);

    this.render();
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    this.addLog("正在初始化技能系統...");

    try {
      await initializeSkills();
      this.addLog("✅ 技能系統初始化完成");
      this.isInitialized = true;
    } catch (e) {
      console.error("Failed to initialize skills:", e);
      this.addLog("⚠️ 技能系統初始化失敗（將使用基本模式）");
      this.isInitialized = true;
    }

    // 監聯 store 變化，處理 MatchEndOverlay 的 rematch
    let previousMatchWinner: "me" | "opponent" | null = null;
    let isResetting = false;
    this.store.subscribe((state) => {
      // 當 matchWinner 從有值變成 null（MatchEndOverlay rematch 被點擊）
      // 且不是由 handleReset 自己觸發的
      if (
        previousMatchWinner !== null &&
        state.matchWinner === null &&
        this.playbackState === "finished" &&
        !isResetting
      ) {
        // 設置標誌防止遞歸
        isResetting = true;
        // 觸發真正的 AI rematch
        this.handleReset();
        // 下一個事件循環重置標誌
        setTimeout(() => {
          isResetting = false;
        }, 0);
      }
      previousMatchWinner = state.matchWinner;
    });
  }

  private render(): void {
    this.appElement = document.querySelector<HTMLDivElement>("#app");
    if (!this.appElement) return;

    this.appElement.innerHTML = "";
    this.appElement.className = "ai-battle-app";

    // 遊戲主容器（初始隱藏）
    this.gameContainer = document.createElement("div");
    this.gameContainer.className = "ai-battle-game-container hidden";

    // 左側：Game Log + OP/DP 顯示
    const leftPanel = document.createElement("div");
    leftPanel.className = "ai-battle-left-panel";
    this.opDpPanel = this.createOpDpPanel();
    leftPanel.appendChild(this.opDpPanel);
    leftPanel.appendChild(this.createGameLogPanel());
    this.gameContainer.appendChild(leftPanel);

    // 中間：遊戲面板
    this.gameContainer.appendChild(this.gameBoard.getElement());

    // 右側：卡片詳情 + 控制面板
    const rightPanel = document.createElement("div");
    rightPanel.className = "ai-battle-right-panel";
    rightPanel.appendChild(this.detailPanel.getElement());
    rightPanel.appendChild(this.controls.getElement());
    this.gameContainer.appendChild(rightPanel);

    this.appElement.appendChild(this.gameContainer);

    // 蓋板式設定面板
    this.setupOverlay = document.createElement("div");
    this.setupOverlay.className = "ai-battle-setup-overlay";
    this.setupOverlay.innerHTML = `
      <div class="setup-overlay-content">
        <h1 class="setup-title">🏐 AI 對戰模式</h1>
        <p class="setup-subtitle">觀看 MCTS AI 之間的對戰</p>
      </div>
    `;
    const overlayContent = this.setupOverlay.querySelector(
      ".setup-overlay-content"
    )!;
    overlayContent.appendChild(this.setup.getElement());

    // 開始按鈕
    const startContainer = document.createElement("div");
    startContainer.className = "setup-start-container";
    startContainer.innerHTML = `
      <button class="setup-start-btn">
        <span class="btn-icon">▶</span>
        <span class="btn-text">開始對戰</span>
      </button>
    `;
    const startBtn = startContainer.querySelector(".setup-start-btn")!;
    startBtn.addEventListener("click", () => this.handleStart());
    overlayContent.appendChild(startContainer);

    this.appElement.appendChild(this.setupOverlay);
  }

  private createOpDpPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "op-dp-panel";
    panel.innerHTML = `
      <div class="op-dp-header">⚡ 攻守點數</div>
      <div class="op-dp-content">
        <div class="op-dp-row me-row">
          <span class="player-label">我方</span>
          <span class="op-value">OP: <strong>0</strong></span>
          <span class="dp-value">DP: <strong>0</strong></span>
        </div>
        <div class="op-dp-row opponent-row">
          <span class="player-label">對手</span>
          <span class="op-value">OP: <strong>0</strong></span>
          <span class="dp-value">DP: <strong>0</strong></span>
        </div>
      </div>
    `;
    return panel;
  }

  private createGameLogPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "game-log-panel";
    panel.innerHTML = `
      <div class="game-log-header">📋 Game Log</div>
      <div class="game-log-content"></div>
    `;
    return panel;
  }

  private addLog(message: string, player?: "me" | "opponent"): void {
    const logContent = this.gameContainer?.querySelector(".game-log-content");
    if (!logContent) return;

    const entry = document.createElement("div");
    entry.className = `log-entry ${player ? player + "-log" : "system-log"}`;
    entry.textContent = message;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;

    // 同時更新 Store 的 logs
    this.store.addLog(message);
  }

  private updateOpDp(): void {
    const engineState = this.battleService.getEngineState();
    if (!engineState || !this.opDpPanel) return;

    const meOp = this.opDpPanel.querySelector(".me-row .op-value strong");
    const meDp = this.opDpPanel.querySelector(".me-row .dp-value strong");
    const oppOp = this.opDpPanel.querySelector(
      ".opponent-row .op-value strong"
    );
    const oppDp = this.opDpPanel.querySelector(
      ".opponent-row .dp-value strong"
    );

    if (meOp) meOp.textContent = String(engineState.me.currentOP);
    if (meDp) meDp.textContent = String(engineState.me.currentDP);
    if (oppOp) oppOp.textContent = String(engineState.opponent.currentOP);
    if (oppDp) oppDp.textContent = String(engineState.opponent.currentDP);
  }

  private handleConfigChange(config: AIBattleConfig): void {
    this.currentConfig = config;
  }

  private async handleStart(): Promise<void> {
    if (!this.isInitialized) {
      this.addLog("⚠️ 請等待初始化完成");
      return;
    }

    this.addLog("正在載入牌組...");

    // 載入牌組
    const [meDeck, opponentDeck, meSchool, oppSchool] = await Promise.all([
      loadDeck(this.currentConfig.meDeckPath),
      loadDeck(this.currentConfig.opponentDeckPath),
      getDeckSchool(this.currentConfig.meDeckPath),
      getDeckSchool(this.currentConfig.opponentDeckPath),
    ]);

    if (meDeck.length < 40 || opponentDeck.length < 40) {
      this.addLog(
        `⚠️ 牌組載入失敗（我方: ${meDeck.length} 張, 對手: ${opponentDeck.length} 張）`
      );
      return;
    }

    this.addLog(`牌組載入完成`);
    this.addLog(`我方: ${meSchool} (${meDeck.length}張)`);
    this.addLog(`對手: ${oppSchool} (${opponentDeck.length}張)`);

    // 初始化對戰
    this.battleService.initialize({
      meDeck,
      opponentDeck,
      meSimulations: this.currentConfig.meSimulations,
      opponentSimulations: this.currentConfig.opponentSimulations,
      firstPlayer: this.currentConfig.firstPlayer,
    });

    // 更新 UI 狀態（包含正確的 school）
    const uiState = this.battleService.getUIState();
    this.store.setState({
      ...uiState,
      gamePhase: "playing",
      viewPerspective: this.currentConfig.firstPlayer,
    } as Partial<AppState>);

    this.lastTurnPlayer = this.currentConfig.firstPlayer;

    this.addLog("🏐 對戰開始！");
    this.addLog(
      `先攻: ${this.currentConfig.firstPlayer === "me" ? "我方" : "對手"}`
    );

    // 隱藏設定蓋板，顯示遊戲容器
    this.setupOverlay?.classList.add("hidden");
    this.gameContainer?.classList.remove("hidden");

    // 禁用控制面板的開始按鈕
    this.setup.setEnabled(false);

    // 開始自動播放
    this.startPlayback();
  }

  private startPlayback(): void {
    this.setPlaybackState("playing");

    const step = () => {
      if (this.playbackState !== "playing") return;

      const result = this.executeStep();
      if (result && !result.isGameOver) {
        this.playbackInterval = window.setTimeout(
          step,
          this.controls.getSpeedMs()
        );
      }
    };

    step();
  }

  private executeStep(): BattleStep | null {
    if (this.battleService.isFinished()) {
      this.handleGameOver();
      return null;
    }

    const step = this.battleService.nextStep();
    if (!step) {
      this.handleGameOver();
      return null;
    }

    // 保存當前的累計戰績（uiState.winCount 是引擎的 setWins，不是總戰績）
    let savedWinCount = this.store.getState().winCount;

    // 如果遊戲結束，先更新戰績
    if (step.isGameOver && step.winner) {
      savedWinCount = {
        me: savedWinCount.me + (step.winner === "me" ? 1 : 0),
        opponent: savedWinCount.opponent + (step.winner === "opponent" ? 1 : 0),
      };
    }

    // 更新存儲（包含 matchWinner，會觸發 MatchEndOverlay）
    const uiState = this.battleService.getUIState();
    this.store.setState({
      ...uiState,
      winCount: savedWinCount, // 保留累計戰績
    } as Partial<AppState>);

    // 更新 OP/DP 顯示
    this.updateOpDp();

    // 攻守交換時自動切換視角
    if (step.player !== this.lastTurnPlayer) {
      this.store.setState({ viewPerspective: step.player });
      this.lastTurnPlayer = step.player;
    }

    // 更新控制面板
    this.controls.updateStatus(
      step.stepNumber,
      step.phaseDescription,
      step.winRate,
      this.battleService.getSetScore()
    );

    // 添加日誌
    const playerLabel = step.player === "me" ? "我方" : "對手";

    // 主動作日誌
    this.addLog(`${playerLabel} ${step.actionDescription}`, step.player);

    // 顯示 OP/DP 變化（如果有變化）
    if (step.opDpChange) {
      const { meOP, opponentOP } = step.opDpChange;
      if (
        meOP.before !== meOP.after ||
        opponentOP.before !== opponentOP.after
      ) {
        const meChange = meOP.after - meOP.before;
        const oppChange = opponentOP.after - opponentOP.before;
        let opLog = "";
        if (meChange !== 0) {
          opLog += `我方OP: ${meOP.before}→${meOP.after} (${
            meChange > 0 ? "+" : ""
          }${meChange})`;
        }
        if (oppChange !== 0) {
          if (opLog) opLog += " | ";
          opLog += `對手OP: ${opponentOP.before}→${opponentOP.after} (${
            oppChange > 0 ? "+" : ""
          }${oppChange})`;
        }
        if (opLog) {
          this.addLog(`📊 ${opLog}`, step.player);
        }
      }
    }

    // 顯示引擎日誌（技能觸發等）
    if (step.engineLogs && step.engineLogs.length > 0) {
      for (const log of step.engineLogs) {
        this.addLog(`⚡ ${log}`, step.player);
      }
    }

    if (step.isGameOver) {
      this.handleGameOver();
    }

    return step;
  }

  private handleGameOver(): void {
    this.stopPlayback();
    this.setPlaybackState("finished");

    const winner = this.battleService.getWinner();
    if (winner) {
      // winCount 已經在 executeStep 中更新
      const currentWinCount = this.store.getState().winCount;

      this.controls.showWinner(winner);
      this.addLog(`🏆 對戰結束！${winner === "me" ? "我方" : "對手"}勝利！`);
      this.addLog(
        `總戰績: ${currentWinCount.me} - ${currentWinCount.opponent}`
      );
    } else {
      this.addLog("對戰結束（平手或異常終止）");
    }
  }

  private handlePause(): void {
    this.stopPlayback();
    this.setPlaybackState("paused");
    this.addLog("⏸ 對戰已暫停");
  }

  private handleResume(): void {
    this.addLog("▶ 繼續對戰");
    this.startPlayback();
  }

  private handleNextStep(): void {
    const step = this.executeStep();
    if (step) {
      this.addLog(`手動執行步驟 #${step.stepNumber}`);
    }
  }

  private handleReset(): void {
    this.stopPlayback();

    // 保存當前戰績
    const currentWinCount = this.store.getState().winCount;

    // 使用 battleService.reset() 重新開始對戰（使用相同牌組）
    this.battleService.reset();

    // 清空日誌
    const logContent = this.gameContainer?.querySelector(".game-log-content");
    if (logContent) logContent.innerHTML = "";

    // 重置 OP/DP
    if (this.opDpPanel) {
      this.opDpPanel.querySelectorAll("strong").forEach((el) => {
        el.textContent = "0";
      });
    }

    // 從引擎獲取初始狀態並更新 UI（保留戰績）
    const uiState = this.battleService.getUIState();
    this.store.setState({
      ...uiState,
      viewPerspective: this.currentConfig.firstPlayer,
      winCount: currentWinCount, // 保留戰績
      matchWinner: null,
    } as Partial<AppState>);

    this.lastTurnPlayer = this.currentConfig.firstPlayer;

    // 重置控制面板顯示（保留戰績顯示）
    this.controls.updateStatus(0, "開始中...", 0.5, currentWinCount);

    this.addLog("🔄 重賽開始！");

    // 自動開始新對戰
    this.startPlayback();
  }

  private handleSpeedChange(speed: "slow" | "normal" | "fast"): void {
    const speedNames = { slow: "慢速", normal: "正常", fast: "快速" };
    this.addLog(`播放速度: ${speedNames[speed]}`);
  }

  private setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;
    this.controls.setPlaybackState(state);
  }

  private stopPlayback(): void {
    if (this.playbackInterval !== null) {
      clearTimeout(this.playbackInterval);
      this.playbackInterval = null;
    }
  }
}

// 啟動應用
new AIBattleApp();
