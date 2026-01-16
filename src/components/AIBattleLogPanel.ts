/**
 * AI Battle Log Panel Component
 * AI 對戰日誌面板 - 顯示 AI 決策和遊戲日誌
 */

export interface LogEntry {
  timestamp: number;
  stepNumber: number;
  player: "me" | "opponent";
  message: string;
  actionType?: string;
  winRate?: number;
}

export class AIBattleLogPanel {
  private element: HTMLElement;
  private logContainer!: HTMLElement;
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  constructor() {
    this.element = document.createElement("div");
    this.element.className = "ai-battle-log-panel";
    this.render();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="log-header">
        <h3>對戰日誌</h3>
        <button class="clear-log-btn" title="清除日誌">✕</button>
      </div>
      <div class="log-container"></div>
    `;

    this.logContainer = this.element.querySelector(".log-container")!;

    const clearBtn = this.element.querySelector(".clear-log-btn")!;
    clearBtn.addEventListener("click", () => this.clear());
  }

  public addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // 限制日誌數量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 渲染新日誌
    const logElement = this.createLogElement(entry);
    this.logContainer.appendChild(logElement);

    // 自動滾動到底部
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  private createLogElement(entry: LogEntry): HTMLElement {
    const logEntry = document.createElement("div");
    logEntry.className = `log-entry ${entry.player}-log`;

    const playerLabel = entry.player === "me" ? "我方" : "對手";
    const winRateStr =
      entry.winRate !== undefined
        ? ` (${Math.round(entry.winRate * 100)}%)`
        : "";

    logEntry.innerHTML = `
      <span class="log-step">#${entry.stepNumber}</span>
      <span class="log-player ${entry.player}-player">${playerLabel}</span>
      <span class="log-message">${entry.message}</span>
      <span class="log-winrate">${winRateStr}</span>
    `;

    return logEntry;
  }

  public addSystemLog(message: string): void {
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry system-log";
    logEntry.innerHTML = `
      <span class="log-message">${message}</span>
    `;
    this.logContainer.appendChild(logEntry);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  public clear(): void {
    this.logs = [];
    this.logContainer.innerHTML = "";
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
