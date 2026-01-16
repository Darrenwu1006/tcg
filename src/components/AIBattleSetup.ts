/**
 * AI Battle Setup Component
 * AI 對戰設定面板 - 牌組選擇和參數設定
 *
 * 設計與現有 SetupOverlay 風格一致
 */

export interface DeckOption {
  id: string;
  name: string;
  school: string;
  path: string;
}

export interface AIBattleConfig {
  meDeckPath: string;
  opponentDeckPath: string;
  meSimulations: number;
  opponentSimulations: number;
  firstPlayer: "me" | "opponent";
}

export interface AIBattleSetupCallbacks {
  onConfigChange: (config: AIBattleConfig) => void;
}

// 預定義的牌組選項
const DECK_OPTIONS: DeckOption[] = [
  {
    id: "seijoh-fast",
    name: "快攻軸",
    school: "青葉城西",
    path: "src/assets/decks/青葉城西/快攻軸.csv",
  },
  {
    id: "seijoh-mid",
    name: "中速軸",
    school: "青葉城西",
    path: "src/assets/decks/青葉城西/中速軸.csv",
  },
  {
    id: "karasuno-block",
    name: "山月攔網軸",
    school: "烏野",
    path: "src/assets/decks/烏野/山月攔網軸.csv",
  },
  {
    id: "karasuno-attack",
    name: "日影攻擊軸",
    school: "烏野",
    path: "src/assets/decks/烏野/日影攻擊軸.csv",
  },
  {
    id: "karasuno-starter",
    name: "預組",
    school: "烏野",
    path: "src/assets/decks/烏野/預組.csv",
  },
  {
    id: "nekoma-starter",
    name: "預組",
    school: "音駒",
    path: "src/assets/decks/音駒/預組.csv",
  },
  {
    id: "fukurodani-burst",
    name: "高爆發軸",
    school: "梟谷",
    path: "src/assets/decks/梟谷/高爆發軸.csv",
  },
  {
    id: "fukurodani-burst2",
    name: "爆發軸二",
    school: "梟谷",
    path: "src/assets/decks/梟谷/爆發軸二.csv",
  },
  {
    id: "mixed-dump",
    name: "垃圾場",
    school: "混合學校",
    path: "src/assets/decks/混合學校/垃圾場.csv",
  },
];

const SIMULATION_OPTIONS = [50, 100, 200, 500, 1000];

export class AIBattleSetup {
  private element: HTMLElement;
  private callbacks: AIBattleSetupCallbacks;
  private config: AIBattleConfig;

  // UI 元素
  private meDeckSelect!: HTMLSelectElement;
  private opponentDeckSelect!: HTMLSelectElement;
  private meSimSelect!: HTMLSelectElement;
  private opponentSimSelect!: HTMLSelectElement;
  private firstPlayerRadios!: NodeListOf<HTMLInputElement>;

  constructor(callbacks: AIBattleSetupCallbacks) {
    this.callbacks = callbacks;
    this.element = document.createElement("div");
    this.element.className = "ai-battle-setup";

    // 預設配置
    this.config = {
      meDeckPath: DECK_OPTIONS[0].path,
      opponentDeckPath: DECK_OPTIONS[6].path, // 梟谷高爆發軸
      meSimulations: 100,
      opponentSimulations: 100,
      firstPlayer: "me",
    };

    this.render();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="setup-header">
        <h2>AI 對戰設定</h2>
      </div>
      
      <div class="setup-grid">
        <div class="setup-column me-column">
          <h3 class="column-title">
            <span class="team-indicator me-indicator"></span>
            我方 (MCTS AI)
          </h3>
          
          <div class="setup-field">
            <label>選擇牌組</label>
            <select class="deck-select me-deck-select"></select>
          </div>
          
          <div class="setup-field">
            <label>模擬次數</label>
            <select class="sim-select me-sim-select"></select>
          </div>
        </div>
        
        <div class="setup-vs">
          <span>VS</span>
        </div>
        
        <div class="setup-column opponent-column">
          <h3 class="column-title">
            <span class="team-indicator opponent-indicator"></span>
            對手 (MCTS AI)
          </h3>
          
          <div class="setup-field">
            <label>選擇牌組</label>
            <select class="deck-select opponent-deck-select"></select>
          </div>
          
          <div class="setup-field">
            <label>模擬次數</label>
            <select class="sim-select opponent-sim-select"></select>
          </div>
        </div>
      </div>
      
      <div class="first-player-section">
        <span class="section-label">先攻：</span>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" name="firstPlayer" value="me" checked />
            <span>我方</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="firstPlayer" value="opponent" />
            <span>對手</span>
          </label>
        </div>
      </div>
    `;

    // 獲取元素引用
    this.meDeckSelect = this.element.querySelector(".me-deck-select")!;
    this.opponentDeckSelect = this.element.querySelector(
      ".opponent-deck-select"
    )!;
    this.meSimSelect = this.element.querySelector(".me-sim-select")!;
    this.opponentSimSelect = this.element.querySelector(
      ".opponent-sim-select"
    )!;
    this.firstPlayerRadios = this.element.querySelectorAll(
      'input[name="firstPlayer"]'
    );

    this.populateSelects();
    this.setupEventListeners();
  }

  private populateSelects(): void {
    // 牌組選擇
    const deckOptionsBySchool = this.groupBySchool(DECK_OPTIONS);

    [this.meDeckSelect, this.opponentDeckSelect].forEach((select, idx) => {
      select.innerHTML = "";

      for (const [school, decks] of Object.entries(deckOptionsBySchool)) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = school;

        decks.forEach((deck) => {
          const option = document.createElement("option");
          option.value = deck.path;
          option.textContent = deck.name;
          optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
      }

      // 設置預設值
      select.value =
        idx === 0 ? this.config.meDeckPath : this.config.opponentDeckPath;
    });

    // 模擬次數選擇
    [this.meSimSelect, this.opponentSimSelect].forEach((select, idx) => {
      select.innerHTML = "";

      SIMULATION_OPTIONS.forEach((sim) => {
        const option = document.createElement("option");
        option.value = String(sim);
        option.textContent = `${sim} 次`;
        select.appendChild(option);
      });

      select.value = String(
        idx === 0 ? this.config.meSimulations : this.config.opponentSimulations
      );
    });
  }

  private groupBySchool(decks: DeckOption[]): Record<string, DeckOption[]> {
    const groups: Record<string, DeckOption[]> = {};

    decks.forEach((deck) => {
      if (!groups[deck.school]) {
        groups[deck.school] = [];
      }
      groups[deck.school].push(deck);
    });

    return groups;
  }

  private setupEventListeners(): void {
    this.meDeckSelect.addEventListener("change", () => {
      this.config.meDeckPath = this.meDeckSelect.value;
      this.notifyChange();
    });

    this.opponentDeckSelect.addEventListener("change", () => {
      this.config.opponentDeckPath = this.opponentDeckSelect.value;
      this.notifyChange();
    });

    this.meSimSelect.addEventListener("change", () => {
      this.config.meSimulations = parseInt(this.meSimSelect.value);
      this.notifyChange();
    });

    this.opponentSimSelect.addEventListener("change", () => {
      this.config.opponentSimulations = parseInt(this.opponentSimSelect.value);
      this.notifyChange();
    });

    this.firstPlayerRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          this.config.firstPlayer = radio.value as "me" | "opponent";
          this.notifyChange();
        }
      });
    });
  }

  private notifyChange(): void {
    this.callbacks.onConfigChange({ ...this.config });
  }

  public getConfig(): AIBattleConfig {
    return { ...this.config };
  }

  public setEnabled(enabled: boolean): void {
    this.meDeckSelect.disabled = !enabled;
    this.opponentDeckSelect.disabled = !enabled;
    this.meSimSelect.disabled = !enabled;
    this.opponentSimSelect.disabled = !enabled;
    this.firstPlayerRadios.forEach((radio) => {
      radio.disabled = !enabled;
    });

    if (enabled) {
      this.element.classList.remove("disabled");
    } else {
      this.element.classList.add("disabled");
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
