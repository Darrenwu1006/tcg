import { Store, AppState } from "../state/Store";

export class MatchEndOverlay {
  private element: HTMLElement;
  private store: Store<AppState>;

  constructor(store: Store<AppState>) {
    this.store = store;
    this.element = document.createElement("div");
    this.element.className = "match-end-overlay";
    this.element.style.display = "none"; // Hidden by default

    this.render();
    this.setupSubscription();
  }

  private setupSubscription() {
    this.store.subscribe((state) => {
      if (state.matchWinner) {
        this.show(state.matchWinner);
      } else {
        this.hide();
      }
    });
  }

  private show(winner: "me" | "opponent") {
    const state = this.store.getState();
    const loser = winner === "me" ? "opponent" : "me";

    const winnerSchool = state[winner].school;
    const loserSchool = state[loser].school;

    const winnerLabel = winner === "me" ? "我方" : "對手";
    const loserLabel = loser === "me" ? "我方" : "對手";

    // Update content
    const content = this.element.querySelector(".match-end-content");
    if (content) {
      content.innerHTML = `
        <h1 class="match-end-title">MATCH END</h1>
        
        <div class="match-end-result">
          <div class="match-end-winner">
            🏆 ${winnerLabel} [${winnerSchool}] WINS 🏆
          </div>
          <div class="match-end-loser">
            ${loserLabel} [${loserSchool}] surrendered
          </div>
        </div>
        
        <div class="match-end-score">
          戰績: 我方 ${state.winCount.me} - ${state.winCount.opponent} 對手
        </div>
        
        <div class="match-end-buttons">
          <button class="btn match-end-btn back-to-setup-btn">Back to Setup</button>
          <button class="btn match-end-btn rematch-btn">Rematch</button>
        </div>
      `;

      // Attach event listeners
      const backBtn = content.querySelector(".back-to-setup-btn");
      const rematchBtn = content.querySelector(".rematch-btn");

      backBtn?.addEventListener("click", () => this.handleBackToSetup());
      rematchBtn?.addEventListener("click", () => this.handleRematch());
    }

    this.element.style.display = "flex";
  }

  private hide() {
    this.element.style.display = "none";
  }

  private handleBackToSetup() {
    // Reload page to return to setup
    location.reload();
  }

  private handleRematch() {
    const state = this.store.getState();

    // Preserve deck configurations and schools
    const meDeckOriginal = [
      ...state.me.deck,
      ...state.me.hand,
      ...state.me.field,
      ...state.me.drop,
      ...state.me.set,
    ];
    const opponentDeckOriginal = [
      ...state.opponent.deck,
      ...state.opponent.hand,
      ...state.opponent.field,
      ...state.opponent.drop,
      ...state.opponent.set,
    ];

    const meSchool = state.me.school;
    const opponentSchool = state.opponent.school;

    // Swap first player
    const newFirstPlayer = state.firstPlayer === "me" ? "opponent" : "me";

    // Shuffle decks
    const shuffledMeDeck = this.shuffleArray(meDeckOriginal);
    const shuffledOpponentDeck = this.shuffleArray(opponentDeckOriginal);

    // Deal Set cards (2 per player)
    const meSet = shuffledMeDeck
      .splice(0, 2)
      .map((card) => ({ ...card, position: "set" }));
    const opponentSet = shuffledOpponentDeck
      .splice(0, 2)
      .map((card) => ({ ...card, position: "set" }));

    // Reset game state
    this.store.setState({
      matchWinner: null,
      firstPlayer: newFirstPlayer,
      turnPlayer: newFirstPlayer,
      phase: "draw",
      me: {
        deck: shuffledMeDeck,
        hand: [],
        set: meSet,
        drop: [],
        field: [],
        school: meSchool,
      },
      opponent: {
        deck: shuffledOpponentDeck,
        hand: [],
        set: opponentSet,
        drop: [],
        field: [],
        school: opponentSchool,
      },
      selectedCard: null,
      selectedCards: [],
      playingCard: null,
      battleState: {
        isAttacking: false,
        defenseChoice: "none",
        attacker: null,
      },
    } as any);

    this.store.addLog(
      `新回合開始！先手：${newFirstPlayer === "me" ? "我方" : "對手"}`
    );
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private render() {
    this.element.innerHTML = `
      <div class="match-end-content">
        <!-- Content will be populated by show() method -->
      </div>
    `;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
