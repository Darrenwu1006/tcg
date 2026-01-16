import { GameEngine } from "../src/engine/GameEngine";
import { Card } from "../src/state/Store";
import { Player } from "../src/engine/Actions";
import { createInitialGameState } from "../src/engine/GameState";

// Mock cards
const mockCard: Card = {
  id: "test-card",
  name: "Test Card",
  type: "CHARACTER",
  school: "karasuno",
  rarity: "N",
  instanceId: "test-id",
};

function createMockDeck(count: number): Card[] {
  return Array(count)
    .fill(null)
    .map((_, i) => ({
      ...mockCard,
      id: `card-${i}`,
      instanceId: `instance-${i}`,
    }));
}

async function testMulligan() {
  console.log("=== Testing Mulligan Phase ===");

  const deck1 = createMockDeck(40);
  const deck2 = createMockDeck(40);
  const engine = new GameEngine(deck1, deck2, "me");

  const state = engine.getState();
  console.log(`Initial Phase: ${state.phase}`);

  if (state.phase !== "setup") {
    console.error("FAILED: Initial phase should be 'setup'");
    return;
  }

  // Player 1 (me) passes
  console.log("Player 'me' chooses PASS");
  const result1 = engine.executeAction({ type: "PASS" }, "me");
  if (!result1.success) {
    console.error("FAILED: Player 'me' PASS failed", result1.error);
    return;
  }
  console.log(
    `Player 'me' mulligan status: ${engine.getState().hasMulligan.me}`
  );

  // Player 2 (opponent) mulligans 1 card
  const opponentHand = engine.getState().opponent.hand;
  const cardToMulligan = opponentHand[0].instanceId;
  console.log("Player 'opponent' chooses MULLIGAN (1 card)");

  const result2 = engine.executeAction(
    {
      type: "MULLIGAN",
      cardInstanceIds: [cardToMulligan],
    },
    "opponent"
  );

  if (!result2.success) {
    console.error("FAILED: Player 'opponent' MULLIGAN failed", result2.error);
    return;
  }
  console.log(
    `Player 'opponent' mulligan status: ${
      engine.getState().hasMulligan.opponent
    }`
  );

  // Check phase transition
  const newState = engine.getState();
  console.log(`New Phase: ${newState.phase}`);

  if (newState.phase === "serve") {
    console.log("SUCCESS: Phase transitioned to 'serve'");
  } else {
    console.error(
      `FAILED: Phase should be 'serve', but is '${newState.phase}'`
    );
  }

  // Check hand size
  console.log(`Opponent hand size: ${newState.opponent.hand.length}`);
  if (newState.opponent.hand.length === 6) {
    console.log("SUCCESS: Opponent hand refilled to 6");
  } else {
    console.error("FAILED: Opponent hand should be 6");
  }
}

testMulligan().catch(console.error);
