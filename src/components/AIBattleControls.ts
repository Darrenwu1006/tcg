/**
 * AI Battle Controls Component
 * AI 對戰控制面板 - 播放控制和狀態顯示
 *
 * 設計與現有 UI 風格一致，可複用
 */

export interface AIBattleControlsCallbacks {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: "slow" | "normal" | "fast") => void;
}

export type PlaybackState = "idle" | "playing" | "paused" | "finished";

export class AIBattleControls {
  private element: HTMLElement;
  private callbacks: AIBattleControlsCallbacks;
  private playbackState: PlaybackState = "idle";
  private speed: "slow" | "normal" | "fast" = "normal";

  // UI 元素
  private startBtn!: HTMLButtonElement;
  private pauseBtn!: HTMLButtonElement;
  private nextStepBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private speedButtons!: HTMLButtonElement[];
  private stepDisplay!: HTMLElement;
  private phaseDisplay!: HTMLElement;
  private winRateBar!: HTMLElement;
  private winRateText!: HTMLElement;
  private setScoreDisplay!: HTMLElement;

  constructor(callbacks: AIBattleControlsCallbacks) {
    this.callbacks = callbacks;
    this.element = document.createElement("div");
    this.element.className = "ai-battle-controls";
    this.render();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="controls-section">
        <div class="control-buttons">
          <button class="control-btn start-btn" data-action="start">
            <span class="btn-icon">▶</span>
            <span class="btn-label">開始</span>
          </button>
          <button class="control-btn pause-btn" data-action="pause" disabled>
            <span class="btn-icon">⏸</span>
            <span class="btn-label">暫停</span>
          </button>
          <button class="control-btn next-step-btn" data-action="next" disabled>
            <span class="btn-icon">⏭</span>
            <span class="btn-label">下一步</span>
          </button>
          <button class="control-btn reset-btn" data-action="reset" disabled>
            <span class="btn-icon">↺</span>
            <span class="btn-label">重置</span>
          </button>
        </div>
        
        <div class="speed-control">
          <span class="speed-label">速度:</span>
          <div class="speed-buttons">
            <button class="speed-btn" data-speed="slow">慢</button>
            <button class="speed-btn active" data-speed="normal">正常</button>
            <button class="speed-btn" data-speed="fast">快</button>
          </div>
        </div>
      </div>
      
      <div class="status-section">
        <div class="status-row">
          <div class="status-item">
            <span class="status-label">步驟</span>
            <span class="status-value step-display">0</span>
          </div>
          <div class="status-item">
            <span class="status-label">階段</span>
            <span class="status-value phase-display">等待開始</span>
          </div>
          <div class="status-item">
            <span class="status-label">Set 分數</span>
            <span class="status-value set-score-display">0 - 0</span>
          </div>
        </div>
        
        <div class="win-rate-container">
          <div class="win-rate-header">
            <span class="team-label me-label">我方</span>
            <span class="win-rate-text">50%</span>
            <span class="team-label opponent-label">對手</span>
          </div>
          <div class="win-rate-bar-container">
            <div class="win-rate-bar me-bar" style="width: 50%"></div>
          </div>
        </div>
      </div>
    `;

    // 獲取元素引用
    this.startBtn = this.element.querySelector(".start-btn")!;
    this.pauseBtn = this.element.querySelector(".pause-btn")!;
    this.nextStepBtn = this.element.querySelector(".next-step-btn")!;
    this.resetBtn = this.element.querySelector(".reset-btn")!;
    this.speedButtons = Array.from(this.element.querySelectorAll(".speed-btn"));
    this.stepDisplay = this.element.querySelector(".step-display")!;
    this.phaseDisplay = this.element.querySelector(".phase-display")!;
    this.winRateBar = this.element.querySelector(".win-rate-bar")!;
    this.winRateText = this.element.querySelector(".win-rate-text")!;
    this.setScoreDisplay = this.element.querySelector(".set-score-display")!;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 控制按鈕
    this.startBtn.addEventListener("click", () => {
      if (this.playbackState === "idle" || this.playbackState === "finished") {
        this.callbacks.onStart();
      } else if (this.playbackState === "paused") {
        this.callbacks.onResume();
      }
    });

    this.pauseBtn.addEventListener("click", () => {
      this.callbacks.onPause();
    });

    this.nextStepBtn.addEventListener("click", () => {
      this.callbacks.onNextStep();
    });

    this.resetBtn.addEventListener("click", () => {
      this.callbacks.onReset();
    });

    // 速度按鈕
    this.speedButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const speed = btn.dataset.speed as "slow" | "normal" | "fast";
        this.setSpeed(speed);
        this.callbacks.onSpeedChange(speed);
      });
    });
  }

  public setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;
    this.updateButtonStates();
  }

  private updateButtonStates(): void {
    switch (this.playbackState) {
      case "idle":
        this.startBtn.disabled = false;
        this.startBtn.querySelector(".btn-label")!.textContent = "開始";
        this.startBtn.querySelector(".btn-icon")!.textContent = "▶";
        this.pauseBtn.disabled = true;
        this.nextStepBtn.disabled = true;
        this.resetBtn.disabled = true;
        break;

      case "playing":
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.nextStepBtn.disabled = true;
        this.resetBtn.disabled = false;
        break;

      case "paused":
        this.startBtn.disabled = false;
        this.startBtn.querySelector(".btn-label")!.textContent = "繼續";
        this.startBtn.querySelector(".btn-icon")!.textContent = "▶";
        this.pauseBtn.disabled = true;
        this.nextStepBtn.disabled = false;
        this.resetBtn.disabled = false;
        break;

      case "finished":
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = true;
        this.nextStepBtn.disabled = true;
        this.resetBtn.disabled = false;
        // 在對戰結束時變更按鈕標籤為「重賽」
        this.resetBtn.querySelector(".btn-label")!.textContent = "重賽";
        break;
    }
  }

  public setSpeed(speed: "slow" | "normal" | "fast"): void {
    this.speed = speed;
    this.speedButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.speed === speed);
    });
  }

  public updateStatus(
    step: number,
    phase: string,
    winRate: number,
    setScore: { me: number; opponent: number }
  ): void {
    this.stepDisplay.textContent = String(step);
    this.phaseDisplay.textContent = phase;
    this.setScoreDisplay.textContent = `${setScore.me} - ${setScore.opponent}`;

    // 更新勝率條
    const percentage = Math.round(winRate * 100);
    this.winRateBar.style.width = `${percentage}%`;
    this.winRateText.textContent = `${percentage}%`;

    // 根據勝率設定顏色
    if (percentage > 60) {
      this.winRateBar.className = "win-rate-bar me-bar winning";
    } else if (percentage < 40) {
      this.winRateBar.className = "win-rate-bar me-bar losing";
    } else {
      this.winRateBar.className = "win-rate-bar me-bar";
    }
  }

  public showWinner(winner: "me" | "opponent"): void {
    const winnerText = winner === "me" ? "我方勝利！" : "對手勝利！";
    this.phaseDisplay.textContent = winnerText;
    this.phaseDisplay.classList.add("winner-display");
    if (winner === "me") {
      this.phaseDisplay.classList.add("me-win");
    } else {
      this.phaseDisplay.classList.add("opponent-win");
    }
  }

  public resetDisplay(): void {
    this.stepDisplay.textContent = "0";
    this.phaseDisplay.textContent = "等待開始";
    this.phaseDisplay.className = "status-value phase-display";
    this.setScoreDisplay.textContent = "0 - 0";
    this.winRateBar.style.width = "50%";
    this.winRateBar.className = "win-rate-bar me-bar";
    this.winRateText.textContent = "50%";
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getSpeedMs(): number {
    switch (this.speed) {
      case "slow":
        return 2000; // 慢速：2秒
      case "normal":
        return 1200; // 正常：1.2秒
      case "fast":
        return 100; // 快速：維持 0.1秒
    }
  }
}
