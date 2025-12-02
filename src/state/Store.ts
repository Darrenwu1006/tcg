type Listener<T> = (state: T) => void;

export interface Card {
  id: string;
  instanceId: string; // Unique ID for this specific card instance
  name: string;
  rarity?: string; // e.g., R, N, S, P, 頂
  role?: string; // e.g., WS, MB, S, Li
  type: "CHARACTER" | "EVENT";
  timing?: string; // Activation timing (e.g., "登場時", "發球區域")
  stats?: {
    serve: number | null;
    block: number | null;
    receive: number | null;
    toss: number | null;
    attack: number | null;
  };
  skill?: string; // Card skill description
  note?: string; // Additional notes
  description?: string; // Fallback for backward compatibility
  originalLine?: string;
  position?: string; // "hand", "deck", "drop", "set", "block-left", "block-center", "block-right", "receive", "toss", "attack", "serve", "event"
}

export interface PlayerState {
  deck: Card[];
  hand: Card[];
  set: Card[];
  drop: Card[];
  field: Card[]; // Cards currently on the field
  school: string; // "seijoh", "karasuno", "nekoma", "fukurodani", etc.
  currentStats?: {
    serve: number;
    block: number;
    receive: number;
    toss: number;
    attack: number;
  };
}

export interface AppState {
  count: number;
  viewPerspective: "me" | "opponent";
  gamePhase: "setup" | "playing";

  // Battle Flow State
  turnPlayer: "me" | "opponent";
  phase: "draw" | "main" | "battle" | "end";
  battleState: {
    isAttacking: boolean;
    defenseChoice: "none" | "block" | "receive";
    attacker: "me" | "opponent" | null;
  };

  firstPlayer: "me" | "opponent" | null;
  selectedCard: Card | null;
  selectedCards: Card[]; // Multi-selection support
  playingCard: Card | null; // Card currently selected for play
  me: PlayerState;
  opponent: PlayerState;
  logs: string[]; // Game action logs
  viewingDeckInfo?: { player: "me" | "opponent" } | null; // Deck Info Overlay state
}

export class Store<T extends AppState> {
  private state: T;
  private listeners: Listener<T>[] = [];
  private history: T[] = [];
  private static readonly MAX_HISTORY = 20;

  constructor(initialState: T) {
    this.state = {
      ...initialState,
      logs: [],
      selectedCards: [],
      turnPlayer: "me", // Default, should be set by setup
      phase: "draw",
      battleState: {
        isAttacking: false,
        defenseChoice: "none",
        attacker: null,
      },
    };
  }

  getState(): T {
    return this.state;
  }

  setState(newState: Partial<T>, addToHistory: boolean = true) {
    if (addToHistory) {
      this.history.push({ ...this.state });
      if (this.history.length > Store.MAX_HISTORY) {
        this.history.shift();
      }
    }
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  undo() {
    if (this.history.length === 0) return;
    const previousState = this.history.pop();
    if (previousState) {
      this.state = previousState;
      this.notify();
    }
  }

  addLog(message: string) {
    const newLogs = this.getNewLogs(message);
    this.setState({ logs: newLogs } as Partial<T>, false);
  }

  // Helper to get new logs array with a message
  getNewLogs(message: string): string[] {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const newLog = `[${timestamp}] ${message}`;
    return [newLog, ...(this.state.logs || [])].slice(0, 50);
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  shuffleDeck(player: "me" | "opponent") {
    const deck =
      player === "me" ? [...this.state.me.deck] : [...this.state.opponent.deck];

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const newState: Partial<T> = {};
    if (player === "me") {
      newState.me = { ...this.state.me, deck };
    } else {
      newState.opponent = { ...this.state.opponent, deck };
    }

    newState.logs = this.getNewLogs(
      `${player === "me" ? "Me" : "Opponent"} shuffled the deck.`
    );

    this.setState(newState as Partial<T>);
  }
}
