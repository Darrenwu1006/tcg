import { Store, AppState } from "../state/Store";
import { CardDatabase } from "../data/CardDatabase";

export class SetupOverlay {
  private element: HTMLElement;
  private store: Store<AppState>;
  private meDeckLoaded = false;
  private opDeckLoaded = false;
  private firstPlayerDecided = false;

  constructor(store: Store<AppState>) {
    this.store = store;
    this.element = document.createElement("div");
    this.element.className = "setup-overlay";

    // Load card database immediately and wait for it
    this.loadDatabase();

    this.render();
  }

  private async loadDatabase() {
    await CardDatabase.getInstance().loadAll();
    console.log("CardDatabase ready");
  }

  private readonly AVAILABLE_DECKS = [
    {
      school: "青葉城西",
      name: "青葉城西卡表 - 極簡軸",
      label: "青葉城西 - 極簡軸",
      schoolKey: "seijoh",
    },
    {
      school: "梟谷",
      name: "梟谷 - 高爆發軸",
      label: "梟谷 - 高爆發軸",
      schoolKey: "fukurodani",
    },
  ];

  private render() {
    const deckOptions = this.AVAILABLE_DECKS.map(
      (deck) =>
        `<option value="${deck.school}|${deck.name}|${deck.schoolKey}">${deck.label}</option>`
    ).join("");

    this.element.innerHTML = `
      <div class="setup-container">
        <h1>Game Setup</h1>
        
        <div class="setup-section">
          <div class="player-setup">
            <h3>Me (Player)</h3>
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
            <h3>Opponent</h3>
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
          <h3>First Player</h3>
          <div class="coin-toss-area">
            <button id="coin-toss-btn" class="btn">Coin Toss</button>
            <span id="toss-result" class="result">?</span>
          </div>
        </div>



        <div class="setup-actions">
            <button id="load-defaults-btn" class="btn">Load Defaults (青葉城西 vs 青葉城西)</button>
        </div>

        <div class="setup-actions">
          <button id="start-game-btn" class="start-btn" disabled>Start Game</button>
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
    const loadDefaultsBtn = this.element.querySelector("#load-defaults-btn");

    meSelect?.addEventListener("change", (e) =>
      this.handleDeckSelection(e, "me")
    );
    opSelect?.addEventListener("change", (e) =>
      this.handleDeckSelection(e, "opponent")
    );

    loadDefaultsBtn?.addEventListener("click", () => this.loadDefaultDecks());

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
    const value = select.value;

    if (!value) {
      if (player === "me") {
        this.meDeckLoaded = false;
      } else {
        this.opDeckLoaded = false;
      }
      this.updateStatus(player, "Not Selected");
      this.checkReady();
      return;
    }

    const [school, deckName, schoolKey] = value.split("|");

    try {
      const db = CardDatabase.getInstance();
      const deck = await db.loadDeck(school, deckName);

      if (deck.length > 0) {
        if (player === "me") {
          this.store.setState({
            me: { ...this.store.getState().me, deck, school: schoolKey },
          });
          this.meDeckLoaded = true;
        } else {
          this.store.setState({
            opponent: {
              ...this.store.getState().opponent,
              deck,
              school: schoolKey,
            },
          });
          this.opDeckLoaded = true;
        }

        const deckLabel =
          this.AVAILABLE_DECKS.find(
            (d) => d.school === school && d.name === deckName
          )?.label || deckName;
        this.updateStatus(
          player,
          `已載入: ${deckLabel} (${deck.length} 張卡片)`
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
    const school = "青葉城西";
    const deckName = "青葉城西卡表 - 極簡軸";
    const schoolKey = "seijoh";

    try {
      const db = CardDatabase.getInstance();

      // Load both decks as 青葉城西
      const [meDeck, opDeck] = await Promise.all([
        db.loadDeck(school, deckName),
        db.loadDeck(school, deckName),
      ]);

      if (meDeck.length > 0) {
        this.store.setState({
          me: { ...this.store.getState().me, deck: meDeck, school: schoolKey },
        });
        this.meDeckLoaded = true;
        this.updateStatus(
          "me",
          `Loaded: ${school} - 極簡軸 (${meDeck.length} cards)`
        );
      }

      if (opDeck.length > 0) {
        this.store.setState({
          opponent: {
            ...this.store.getState().opponent,
            deck: opDeck,
            school: schoolKey,
          },
        });
        this.opDeckLoaded = true;
        this.updateStatus(
          "opponent",
          `Loaded: ${school} - 極簡軸 (${opDeck.length} cards)`
        );
      }

      this.checkReady();
    } catch (error) {
      console.error("Failed to load default decks:", error);
      alert("Failed to load default decks. Check console.");
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
