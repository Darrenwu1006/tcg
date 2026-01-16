import { ActionExecutor } from "../src/engine/ActionExecutor";
import { GameAction } from "../src/engine/Actions";
import { EngineGameState } from "../src/engine/GameState";

const mockState: EngineGameState = {
  phase: "serve",
  turnPlayer: "me",
  me: { hand: [], deck: [], drop: [], field: [], set: [], currentOP: 0 },
  opponent: { hand: [], deck: [], drop: [], field: [], set: [], currentOP: 0 },
  gameOver: false,
  winner: null,
  logs: [],
};

const action: GameAction = {
  type: "USE_EVENT",
  cardInstanceId: "test-id",
};

console.log("Testing ActionExecutor...");
const result = ActionExecutor.execute(mockState, action, "me");
console.log("Result:", result);
