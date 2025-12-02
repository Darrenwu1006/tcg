import { Store, AppState } from "../state/Store";

export class StatsPanel {
  private element: HTMLElement;
  private store: Store<AppState>;

  // Base stats from board (auto-calculated)
  private meBaseAttack: number = 0;
  private meBaseDefense: number = 0;
  private opBaseAttack: number = 0;
  private opBaseDefense: number = 0;

  // Manual modifiers (user adjusted)
  private meManualAttack: number = 0;
  private meManualDefense: number = 0;
  private opManualAttack: number = 0;
  private opManualDefense: number = 0;

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
      // Sync stats from store if available
      // Note: User requested "Serve -> Attack points".
      // Let's assume:
      // Serve Slot -> Attack Point (Serve is offensive)
      // Attack Slot -> Attack Point
      // Toss Slot -> Attack Point (Support for attack)
      // Block Slot -> Defense Point
      // Receive Slot -> Defense Point

      // Actually, let's look at the user request again:
      // "當我把及川 頂放到發球區，我的攻擊點數就會出現五。同理在其他區域也是。"
      // "放在我方就出現我方，對手放他的區域就顯示在他的計數器。"

      // Let's define a mapping:
      // Attack Stats = Serve + Attack + Toss
      // Defense Stats = Block + Receive

      const meStats = state.me.currentStats;
      if (meStats) {
        this.meBaseAttack =
          (meStats.serve || 0) + (meStats.attack || 0) + (meStats.toss || 0);
        this.meBaseDefense = (meStats.block || 0) + (meStats.receive || 0);
      }

      const opStats = state.opponent.currentStats;
      if (opStats) {
        this.opBaseAttack =
          (opStats.serve || 0) + (opStats.attack || 0) + (opStats.toss || 0);
        this.opBaseDefense = (opStats.block || 0) + (opStats.receive || 0);
      }

      this.updateAllDisplays();
      this.renderLogs(state.logs);
    });
  }

  private render() {
    this.element.innerHTML = `
      <h2>Stats Calculator</h2>
      
      <div class="stats-section me-stats">
        <h3>Me</h3>
        <div class="stat-placeholder">
            <label>Attack</label>
            <div class="stat-controls">
                <button class="stat-btn" data-target="me" data-type="attack" data-op="minus">-</button>
                <div class="value" id="me-attack-val">${
                  this.meBaseAttack + this.meManualAttack
                }</div>
                <button class="stat-btn" data-target="me" data-type="attack" data-op="plus">+</button>
            </div>
        </div>
        <div class="stat-placeholder">
            <label>Defense</label>
            <div class="stat-controls">
                <button class="stat-btn" data-target="me" data-type="defense" data-op="minus">-</button>
                <div class="value" id="me-defense-val">${
                  this.meBaseDefense + this.meManualDefense
                }</div>
                <button class="stat-btn" data-target="me" data-type="defense" data-op="plus">+</button>
            </div>
        </div>
        </div>
        <button class="btn reset-stats-btn" data-target="me" style="width: 100%; margin-top: 10px;">Reset Me</button>
      </div>

      <div class="stats-section op-stats">
        <h3>Opponent</h3>
        <div class="stat-placeholder">
            <label>Attack</label>
            <div class="stat-controls">
                <button class="stat-btn" data-target="op" data-type="attack" data-op="minus">-</button>
                <div class="value" id="op-attack-val">${
                  this.opBaseAttack + this.opManualAttack
                }</div>
                <button class="stat-btn" data-target="op" data-type="attack" data-op="plus">+</button>
            </div>
        </div>
        <div class="stat-placeholder">
            <label>Defense</label>
            <div class="stat-controls">
                <button class="stat-btn" data-target="op" data-type="defense" data-op="minus">-</button>
                <div class="value" id="op-defense-val">${
                  this.opBaseDefense + this.opManualDefense
                }</div>
                <button class="stat-btn" data-target="op" data-type="defense" data-op="plus">+</button>
            </div>
        </div>
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
          this.meManualAttack = -this.meBaseAttack;
          this.meManualDefense = -this.meBaseDefense;
          this.store.addLog("Me reset their stats.");
        } else if (player === "op") {
          this.opManualAttack = -this.opBaseAttack;
          this.opManualDefense = -this.opBaseDefense;
          this.store.addLog("Opponent stats were reset.");
        }
        this.updateAllDisplays();
        return;
      }

      // Stat Buttons
      if (target.classList.contains("stat-btn")) {
        const player = target.getAttribute("data-target"); // 'me' or 'op'
        const type = target.getAttribute("data-type"); // 'attack' or 'defense'
        const op = target.getAttribute("data-op"); // 'plus' or 'minus'

        if (player === "me") {
          if (type === "attack") {
            this.meManualAttack += op === "plus" ? 1 : -1;
          } else {
            this.meManualDefense += op === "plus" ? 1 : -1;
          }
        } else {
          if (type === "attack") {
            this.opManualAttack += op === "plus" ? 1 : -1;
          } else {
            this.opManualDefense += op === "plus" ? 1 : -1;
          }
        }
        this.updateAllDisplays();
      }
    });
  }

  private updateAllDisplays() {
    this.updateDisplay("me", "attack", this.meBaseAttack + this.meManualAttack);
    this.updateDisplay(
      "me",
      "defense",
      this.meBaseDefense + this.meManualDefense
    );
    this.updateDisplay("op", "attack", this.opBaseAttack + this.opManualAttack);
    this.updateDisplay(
      "op",
      "defense",
      this.opBaseDefense + this.opManualDefense
    );
  }

  private updateDisplay(player: string, type: string, value: number) {
    const el = this.element.querySelector(`#${player}-${type}-val`);
    if (el) {
      // Ensure value doesn't go below 0 (optional, but good for UI)
      el.textContent = Math.max(0, value).toString();
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
