import { Store, AppState } from "../state/Store";

export class StatsPanel {
  private element: HTMLElement;
  private store: Store<AppState>;

  // Manual modifiers (user adjusted)
  private meStats = { serve: 0, toss: 0, attack: 0, receive: 0, block: 0 };
  private opStats = { serve: 0, toss: 0, attack: 0, receive: 0, block: 0 };

  constructor(store: Store<AppState>) {
    this.store = store;
    this.element = document.createElement("div");
    this.element.className = "stats-panel";
    this.render();
    this.attachEvents();
    this.setupSubscription();
  }

  private setupSubscription() {
    this.store.subscribe((state) => {
      this.renderLogs(state.logs);
    });
  }

  private render() {
    this.element.innerHTML = `
      <div class="stats-section me-stats">
        <h3>Me</h3>
        
        <div class="stat-group">
            <div class="stat-group-title">
              <span>攻擊 (Attack)</span>
              <span class="stat-group-total" id="me-attack-total">0</span>
            </div>
            ${this.renderStatRow("me", "serve", "發球", this.meStats.serve)}
            ${this.renderStatRow("me", "toss", "舉球", this.meStats.toss)}
            ${this.renderStatRow("me", "attack", "攻擊", this.meStats.attack)}
        </div>

        <div class="stat-group">
            <div class="stat-group-title">
              <span>防守 (Defense)</span>
              <span class="stat-group-total" id="me-defense-total">0</span>
            </div>
            ${this.renderStatRow("me", "receive", "接球", this.meStats.receive)}
            ${this.renderStatRow("me", "block", "攔網", this.meStats.block)}
        </div>
        
        <button class="btn reset-stats-btn" data-target="me" style="width: 100%; margin-top: 10px;">Reset Me</button>
      </div>

      <div class="stats-section op-stats">
        <h3>Opponent</h3>

        <div class="stat-group">
            <div class="stat-group-title">
              <span>攻擊 (Attack)</span>
              <span class="stat-group-total" id="op-attack-total">0</span>
            </div>
            ${this.renderStatRow("op", "serve", "發球", this.opStats.serve)}
            ${this.renderStatRow("op", "toss", "舉球", this.opStats.toss)}
            ${this.renderStatRow("op", "attack", "攻擊", this.opStats.attack)}
        </div>

        <div class="stat-group">
            <div class="stat-group-title">
              <span>防守 (Defense)</span>
              <span class="stat-group-total" id="op-defense-total">0</span>
            </div>
            ${this.renderStatRow("op", "receive", "接球", this.opStats.receive)}
            ${this.renderStatRow("op", "block", "攔網", this.opStats.block)}
        </div>

        <button class="btn reset-stats-btn" data-target="op" style="width: 100%; margin-top: 10px;">Reset Opp</button>
      </div>

      <div class="game-log-section">
        <h3>Game Log</h3>
        <div class="game-log-container" id="game-log-container">
          <!-- Logs will be rendered here -->
        </div>
      </div>
    `;
  }

  private renderStatRow(player: "me" | "op", type: string, label: string, value: number) {
    return `
      <div class="stat-placeholder">
          <label>${label}</label>
          <div class="stat-controls">
              <button class="stat-btn" data-target="${player}" data-type="${type}" data-op="minus">-</button>
              <div class="value" id="${player}-${type}-val">${value}</div>
              <button class="stat-btn" data-target="${player}" data-type="${type}" data-op="plus">+</button>
          </div>
      </div>
    `;
  }

  private renderLogs(logs: string[] | undefined) {
    const container = this.element.querySelector("#game-log-container");
    if (!container) return;

    if (!logs || logs.length === 0) {
      container.innerHTML = "<div class='log-entry empty'>No actions yet</div>";
      return;
    }

    container.innerHTML = logs
      .map((log) => `<div class="log-entry">${log}</div>`)
      .join("");
  }

  private attachEvents() {
    this.element.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      // Reset Button
      if (target.classList.contains("reset-stats-btn")) {
        const player = target.getAttribute("data-target");
        if (player === "me") {
          this.meStats = { serve: 0, toss: 0, attack: 0, receive: 0, block: 0 };
          this.store.addLog("Me reset their stats.");
        } else if (player === "op") {
          this.opStats = { serve: 0, toss: 0, attack: 0, receive: 0, block: 0 };
          this.store.addLog("Opponent stats were reset.");
        }
        this.updateAllDisplays();
        return;
      }

      // Stat Buttons
      if (target.classList.contains("stat-btn")) {
        const player = target.getAttribute("data-target") as "me" | "op";
        const type = target.getAttribute("data-type") as keyof typeof this.meStats;
        const op = target.getAttribute("data-op");

        const delta = op === "plus" ? 1 : -1;

        if (player === "me") {
          this.meStats[type] += delta;
        } else {
          this.opStats[type] += delta;
        }
        this.updateAllDisplays();
      }
    });
  }

  private updateAllDisplays() {
    (Object.keys(this.meStats) as Array<keyof typeof this.meStats>).forEach((key) => {
      this.updateDisplay("me", key, this.meStats[key]);
      this.updateDisplay("op", key, this.opStats[key]);
    });
    
    this.updateTotalDisplay("me", "attack", this.meStats.serve + this.meStats.toss + this.meStats.attack);
    this.updateTotalDisplay("me", "defense", this.meStats.receive + this.meStats.block);
    this.updateTotalDisplay("op", "attack", this.opStats.serve + this.opStats.toss + this.opStats.attack);
    this.updateTotalDisplay("op", "defense", this.opStats.receive + this.opStats.block);
  }

  private updateTotalDisplay(player: "me" | "op", group: string, value: number) {
    const el = this.element.querySelector(`#${player}-${group}-total`);
    if (el) {
      el.textContent = value.toString();
    }
  }

  private updateDisplay(player: "me" | "op", type: string, value: number) {
    const el = this.element.querySelector(`#${player}-${type}-val`);
    if (el) {
      el.textContent = value.toString();
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
