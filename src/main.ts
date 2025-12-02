import "./style.css";
import { Store, AppState } from "./state/Store";
import { GameBoard } from "./components/GameBoard";
import { SetupOverlay } from "./components/SetupOverlay";
import { CardDetailPanel } from "./components/CardDetailPanel";
import { StatsPanel } from "./components/StatsPanel";

// Initialize Store
const initialState: AppState = {
  count: 0,
  viewPerspective: "me",
  gamePhase: "setup",
  firstPlayer: null,
  selectedCard: null,
  playingCard: null,
  me: { deck: [], hand: [], set: [], drop: [], field: [], school: "seijoh" },
  opponent: {
    deck: [],
    hand: [],
    set: [],
    drop: [],
    field: [],
    school: "karasuno",
  },
  logs: [],
  turnPlayer: "me",
  phase: "draw",
  battleState: {
    isAttacking: false,
    defenseChoice: "none",
    attacker: null,
  },
  selectedCards: [],
};

const store = new Store<AppState>(initialState);

// Render
const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.innerHTML = "";
  app.className = "app-container"; // Apply grid layout

  const statsPanel = new StatsPanel(store);
  const gameBoard = new GameBoard(store);
  const detailPanel = new CardDetailPanel(store);
  const setupOverlay = new SetupOverlay(store);

  // Append columns
  app.appendChild(statsPanel.getElement());
  app.appendChild(gameBoard.getElement());
  app.appendChild(detailPanel.getElement());

  // Overlay is absolute, so order doesn't strictly matter for layout flow,
  // but usually last to be on top (z-index handles it too)
  document.body.appendChild(setupOverlay.getElement());
}
