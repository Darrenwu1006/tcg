import { Store, AppState } from "../state/Store";
import { CardDatabase } from "../data/CardDatabase";

export class SetupOverlay {
  private element: HTMLElement;
  private store: Store<AppState>;
  private meDeckLoaded = false;
  private opDeckLoaded = false;
  private firstPlayerDecided = false;
  private availableDecks: any[] = [];

  constructor(store: Store<AppState>) {
    this.store = store;
    this.element = document.createElement("div");
    this.element.className = "setup-overlay";

    // Load card database immediately and wait for it
    this.loadDatabase();

    this.render();
  }

  private async loadDatabase() {
    const db = CardDatabase.getInstance();
    await db.loadAll();
    console.log("CardDatabase ready");

    this.availableDecks = await db.getAvailableDecks();
    this.render(); // Re-render to show decks
    this.loadDefaultDecks();
  }

  private render() {
    const deckOptions = this.availableDecks
      .map(
        (deck) =>
          `<option value="${deck.path}">${deck.school} - ${deck.name}</option>`
      )
      .join("");

    this.element.innerHTML = `
      <div class="setup-container">
        <div class="setup-header">
          <h1 class="retro-title-en">GAME SETUP</h1>
          <h2 class="retro-title-zh">遊戲設定</h2>
        </div>
        
        <div class="setup-section">
          <div class="player-setup">
            <h3 class="retro-subtitle-en">Me (Player)</h3>
            <h4 class="retro-subtitle-zh">我方玩家</h4>
            <div class="deck-select">
              <label>選擇牌組:</label>
              <select id="me-deck-select" class="deck-dropdown">
                <option value="">--- 請選擇 ---</option>
                ${deckOptions}
              </select>
              <span id="me-deck-status" class="status">Not Selected</span>
            </div>
          </div>

          <div class="player-setup">
            <h3 class="retro-subtitle-en">Opponent</h3>
            <h4 class="retro-subtitle-zh">對手</h4>
            <div class="deck-select">
              <label>選擇牌組:</label>
              <select id="op-deck-select" class="deck-dropdown">
                <option value="">--- 請選擇 ---</option>
                ${deckOptions}
              </select>
              <span id="op-deck-status" class="status">Not Selected</span>
            </div>
          </div>
        </div>

        <div class="setup-section">
          <h3 class="retro-subtitle-en">First Player</h3>
          <h4 class="retro-subtitle-zh">先攻玩家</h4>
          <div class="coin-toss-area">
            <button id="coin-toss-btn" class="btn">Coin Toss</button>
            <span id="toss-result" class="result">?</span>
          </div>
        </div>

        <div class="setup-actions">
          <button id="start-game-btn" class="start-btn" disabled>START GAME</button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    const meSelect = this.element.querySelector("#me-deck-select");
    const opSelect = this.element.querySelector("#op-deck-select");
    const tossBtn = this.element.querySelector("#coin-toss-btn");
    const startBtn = this.element.querySelector("#start-game-btn");

    meSelect?.addEventListener("change", (e) =>
      this.handleDeckSelection(e, "me")
    );
    opSelect?.addEventListener("change", (e) =>
      this.handleDeckSelection(e, "opponent")
    );

    tossBtn?.addEventListener("click", () => {
      const result = Math.random() < 0.5 ? "me" : "opponent";
      this.store.setState({ firstPlayer: result });
      const resultEl = this.element.querySelector("#toss-result");
      if (resultEl) {
        resultEl.textContent = result === "me" ? "Me" : "Opponent";
        resultEl.className = "result decided";
      }
      this.firstPlayerDecided = true;
      this.checkReady();
    });

    startBtn?.addEventListener("click", () => {
      this.startGame();
    });
  }

  private async handleDeckSelection(event: Event, player: "me" | "opponent") {
    const select = event.target as HTMLSelectElement;
    const path = select.value;

    if (!path) {
      if (player === "me") {
        this.meDeckLoaded = false;
      } else {
        this.opDeckLoaded = false;
      }
      this.updateStatus(player, "Not Selected");
      this.checkReady();
      return;
    }

    const deckInfo = this.availableDecks.find((d) => d.path === path);
    if (!deckInfo) return;

    try {
      const db = CardDatabase.getInstance();
      const deck = await db.loadDeck(deckInfo.loader);

      if (deck.length > 0) {
        if (player === "me") {
          this.store.setState({
            me: { ...this.store.getState().me, deck, school: deckInfo.school },
          });
          this.meDeckLoaded = true;
        } else {
          this.store.setState({
            opponent: {
              ...this.store.getState().opponent,
              deck,
              school: deckInfo.school,
            },
          });
          this.opDeckLoaded = true;
        }

        this.updateStatus(
          player,
          `已載入: ${deckInfo.name} (${deck.length} 張卡片)`
        );
        this.checkReady();
      }
    } catch (error) {
      console.error(`Failed to load deck for ${player}:`, error);
      this.updateStatus(player, "載入失敗");
      if (player === "me") {
        this.meDeckLoaded = false;
      } else {
        this.opDeckLoaded = false;
      }
      this.checkReady();
    }
  }

  private async loadDefaultDecks() {
    // Default to Seijoh deck if available
    const defaultDeck = this.availableDecks.find(
      (d) => d.school === "青葉城西" && d.name.includes("快攻軸")
    );

    if (!defaultDeck) {
      console.warn("Default deck not found");
      return;
    }

    try {
      const db = CardDatabase.getInstance();

      // Load both decks
      const [meDeck, opDeck] = await Promise.all([
        db.loadDeck(defaultDeck.loader),
        db.loadDeck(defaultDeck.loader),
      ]);

      if (meDeck.length > 0) {
        this.store.setState({
          me: {
            ...this.store.getState().me,
            deck: meDeck,
            school: defaultDeck.school,
          },
        });
        this.meDeckLoaded = true;
        this.updateStatus(
          "me",
          `Loaded: ${defaultDeck.name} (${meDeck.length} cards)`
        );

        // Update select element
        const meSelect = this.element.querySelector(
          "#me-deck-select"
        ) as HTMLSelectElement;
        if (meSelect) meSelect.value = defaultDeck.path;
      }

      if (opDeck.length > 0) {
        this.store.setState({
          opponent: {
            ...this.store.getState().opponent,
            deck: opDeck,
            school: defaultDeck.school,
          },
        });
        this.opDeckLoaded = true;
        this.updateStatus(
          "opponent",
          `Loaded: ${defaultDeck.name} (${opDeck.length} cards)`
        );

        // Update select element
        const opSelect = this.element.querySelector(
          "#op-deck-select"
        ) as HTMLSelectElement;
        if (opSelect) opSelect.value = defaultDeck.path;
      }

      this.checkReady();
    } catch (error) {
      console.error("Failed to load default decks:", error);
    }
  }

  private updateStatus(player: "me" | "opponent", text: string) {
    const id = player === "me" ? "me-deck-status" : "op-deck-status";
    const el = this.element.querySelector(`#${id}`);
    if (el) el.textContent = text;
  }

  private checkReady() {
    const startBtn = this.element.querySelector(
      "#start-game-btn"
    ) as HTMLButtonElement;
    if (this.meDeckLoaded && this.opDeckLoaded && this.firstPlayerDecided) {
      startBtn.disabled = false;
    }
  }

  private startGame() {
    // 1. Shuffle Decks
    const state = this.store.getState();
    const meDeck = this.shuffle([...state.me.deck]);
    const opDeck = this.shuffle([...state.opponent.deck]);

    // 2. Draw 6 cards (Hand)
    const meHand = meDeck.splice(0, 6);
    const opHand = opDeck.splice(0, 6);

    // 3. Place 2 cards (Set)
    const meSet = meDeck.splice(0, 2);
    const opSet = opDeck.splice(0, 2);

    // 4. Update Store
    this.store.setState({
      gamePhase: "playing",
      me: { ...state.me, deck: meDeck, hand: meHand, set: meSet },
      opponent: { ...state.opponent, deck: opDeck, hand: opHand, set: opSet },
    });

    this.element.style.display = "none";
  }

  private shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
