import "./style.css";
import { Store, AppState } from "./state/Store";
import { GameBoard } from "./components/GameBoard";
import { SetupOverlay } from "./components/SetupOverlay";
import { CardDetailPanel } from "./components/CardDetailPanel";
import { StatsPanel } from "./components/StatsPanel";
import { HumanActionPanel } from "./components/HumanActionPanel";
import { HumanVsAIController } from "./services/HumanVsAIController";

// Initialize Store
const initialState: AppState = {
  viewPerspective: "me",
  gamePhase: "setup",
  playMode: "manual",
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
  winCount: { me: 0, opponent: 0 },
  selectedCards: [],
  matchWinner: null,
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
  const humanVsAIController = new HumanVsAIController(store);
  const humanActionPanel = new HumanActionPanel(store, humanVsAIController);
  const setupOverlay = new SetupOverlay(store, {
    onStartVsComputer: (config) => humanVsAIController.start(config),
  });

  // Append columns
  app.appendChild(statsPanel.getElement());
  app.appendChild(gameBoard.getElement());
  const rightColumn = document.createElement("div");
  rightColumn.className = "right-tool-column";
  rightColumn.appendChild(humanActionPanel.getElement());
  rightColumn.appendChild(detailPanel.getElement());
  app.appendChild(rightColumn);

  // Overlay is absolute, so order doesn't strictly matter for layout flow,
  // but usually last to be on top (z-index handles it too)
  document.body.appendChild(setupOverlay.getElement());
}
