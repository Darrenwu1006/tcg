/**
 * MCTS (Monte Carlo Tree Search) Engine
 * 蒙地卡羅樹搜索引擎
 */

import { EngineGameState, cloneGameState } from "./GameState";
import { GameAction, Player, ActionResult } from "./Actions";
import { GameEngine } from "./GameEngine";
import { RuleValidator } from "./RuleValidator";
import { ActionExecutor } from "./ActionExecutor";

// Log Levels
export enum MCTSLogLevel {
  NONE = 0,
  SUMMARY = 1, // 只顯示最終選擇
  DETAILED = 2, // 顯示候選動作評估
  DEBUG = 3, // 顯示搜索過程細節
}

/**
 * MCTS Logger
 */
export class MCTSLogger {
  constructor(public level: MCTSLogLevel = MCTSLogLevel.DETAILED) {}

  log(level: MCTSLogLevel, message: string) {
    if (this.level >= level) {
      console.log(`[MCTS] ${message}`);
    }
  }

  logActionStats(
    action: GameAction,
    visits: number,
    wins: number,
    totalSimulations: number
  ) {
    if (this.level >= MCTSLogLevel.DETAILED) {
      const winRate = ((wins / visits) * 100).toFixed(1);
      const visitRate = ((visits / totalSimulations) * 100).toFixed(1);
      const actionStr = this.formatAction(action);
      console.log(
        `  [${winRate}% Win] ${actionStr} (Visits: ${visits} - ${visitRate}%)`
      );
    }
  }

  private formatAction(action: GameAction): string {
    switch (action.type) {
      case "PLAY_SERVE":
        return `Serve(${action.cardInstanceId.slice(0, 4)})`;
      case "CHOOSE_DEFENSE":
        return `Defense(${action.choice})`;
      case "PLAY_BLOCK":
        return `Block(${action.cardInstanceIds.length})`;
      case "PLAY_RECEIVE":
        return `Receive(${action.cardInstanceId.slice(0, 4)})`;
      case "PLAY_TOSS":
        return `Toss(${action.cardInstanceId.slice(0, 4)})`;
      case "PLAY_ATTACK":
        return `Attack(${action.cardInstanceId.slice(0, 4)})`;
      case "ACTIVATE_SKILL":
        return `Skill(${action.cardInstanceId.slice(0, 4)})`;
      case "USE_EVENT":
        return `Event(${action.cardInstanceId.slice(0, 4)})`;
      case "MULLIGAN":
        return `Mulligan(${action.cardInstanceIds.length})`;
      default:
        return action.type;
    }
  }
}

/**
 * MCTS Node
 */
export class MCTSNode {
  state: EngineGameState;
  parent: MCTSNode | null;
  children: MCTSNode[];
  action: GameAction | null; // The action that led to this state

  visits: number;
  wins: number; // Wins for the player who made the move to get here

  legalActions: GameAction[] | null; // Cache for legal actions
  untriedActions: GameAction[];

  constructor(
    state: EngineGameState,
    parent: MCTSNode | null = null,
    action: GameAction | null = null
  ) {
    this.state = state;
    this.parent = parent;
    this.action = action;
    this.children = [];
    this.visits = 0;
    this.wins = 0;
    this.legalActions = null;
    this.untriedActions = [];
  }

  isFullyExpanded(): boolean {
    return this.untriedActions.length === 0 && this.children.length > 0;
  }

  isTerminal(): boolean {
    return this.state.gameOver;
  }

  // UCT (Upper Confidence Bound for Trees) value
  getUCTValue(explorationConstant: number = 1.414): number {
    if (this.visits === 0) return Infinity;

    // Win rate from the perspective of the parent node's player
    // If parent is "me", and this node represents "me" making a move,
    // then wins should be "me"'s wins.
    // However, usually MCTS stores wins for the player who just moved.
    // Let's standardize: 'wins' stores wins for the player who acted to reach this node.

    return (
      this.wins / this.visits +
      explorationConstant *
        Math.sqrt(Math.log(this.parent!.visits) / this.visits)
    );
  }
}

/**
 * MCTS Engine
 */
export class MCTS {
  private root: MCTSNode | null = null;
  private logger: MCTSLogger;
  private player: Player; // The AI player ("me" or "opponent")

  constructor(player: Player, logLevel: MCTSLogLevel = MCTSLogLevel.DETAILED) {
    this.player = player;
    this.logger = new MCTSLogger(logLevel);
  }

  // Main entry point
  public selectAction(
    rootState: EngineGameState,
    simulations: number = 1000
  ): { action: GameAction; winRate: number } {
    this.logger.log(
      MCTSLogLevel.SUMMARY,
      `Starting search with ${simulations} simulations...`
    );

    // Clone root state to avoid modifying actual game state
    const clonedState = cloneGameState(rootState);
    this.root = new MCTSNode(clonedState);

    // Initialize legal actions for root
    this.root.legalActions = RuleValidator.getLegalActions(
      this.root.state,
      this.root.state.turnPlayer
    );
    this.root.untriedActions = [...this.root.legalActions];

    if (this.root.legalActions.length === 0) {
      console.error("MCTS Root State Debug:");
      console.error(`Phase: ${this.root.state.phase}`);
      console.error(`TurnPlayer: ${this.root.state.turnPlayer}`);
      console.error(`Me Hand: ${this.root.state.me.hand.length}`);
      console.error(`Opponent Hand: ${this.root.state.opponent.hand.length}`);
      console.error(
        `HasMulligan: ${JSON.stringify(this.root.state.hasMulligan)}`
      );
      throw new Error("No legal actions available for MCTS root");
    }

    if (this.root.legalActions.length === 1) {
      this.logger.log(
        MCTSLogLevel.SUMMARY,
        "Only one legal action, skipping search."
      );
      return { action: this.root.legalActions[0], winRate: 0.5 }; // Default 50% for forced move
    }

    // Run simulations
    for (let i = 0; i < simulations; i++) {
      const node = this.selection(this.root);
      const winner = this.simulation(node.state);
      this.backpropagation(node, winner);
    }

    // Select best child (most visited)
    const bestChild = this.getBestChild(this.root);
    const bestWinRate =
      bestChild.visits > 0 ? bestChild.wins / bestChild.visits : 0;

    // Log stats
    this.logger.log(
      MCTSLogLevel.SUMMARY,
      `Search complete. Root visits: ${this.root.visits}`
    );
    this.logger.log(MCTSLogLevel.DETAILED, "Action evaluations:");
    this.root.children
      .sort((a, b) => b.visits - a.visits)
      .forEach((child) => {
        // Wins in child node are wins for the player who took the action (this.player)
        this.logger.logActionStats(
          child.action!,
          child.visits,
          child.wins,
          this.root!.visits
        );
      });

    return { action: bestChild.action!, winRate: bestWinRate };
  }

  // 1. Selection
  private selection(node: MCTSNode): MCTSNode {
    let current = node;

    while (!current.isTerminal()) {
      if (current.untriedActions.length > 0) {
        return this.expansion(current);
      }

      if (current.children.length === 0) {
        // Should not happen if not terminal and no untried actions,
        // unless no legal actions (e.g. stuck state, treated as terminal-ish)
        return current;
      }

      current = this.getBestUCTChild(current);
    }

    return current;
  }

  // 2. Expansion
  private expansion(node: MCTSNode): MCTSNode {
    // Select a random untried action
    const index = Math.floor(Math.random() * node.untriedActions.length);
    const action = node.untriedActions.splice(index, 1)[0];

    // Execute action on a cloned state
    const newState = cloneGameState(node.state);
    ActionExecutor.execute(newState, action, newState.turnPlayer);

    const childNode = new MCTSNode(newState, node, action);

    // Initialize legal actions for the new child
    if (!childNode.isTerminal()) {
      childNode.legalActions = RuleValidator.getLegalActions(
        childNode.state,
        childNode.state.turnPlayer
      );
      childNode.untriedActions = [...childNode.legalActions];
    }

    node.children.push(childNode);
    return childNode;
  }

  // 3. Simulation (Rollout)
  private simulation(state: EngineGameState): Player | null {
    // Use GameEngine's simulation logic or implement a lightweight random rollout here
    // For performance, we'll implement a lightweight version here using RuleValidator and ActionExecutor directly

    let currentState = cloneGameState(state);
    let moves = 0;
    const maxMoves = 50; // Limit rollout length to prevent infinite loops and save time

    while (!currentState.gameOver && moves < maxMoves) {
      const legalActions = RuleValidator.getLegalActions(
        currentState,
        currentState.turnPlayer
      );
      if (legalActions.length === 0) break;

      // Random policy
      const randomAction =
        legalActions[Math.floor(Math.random() * legalActions.length)];
      ActionExecutor.execute(
        currentState,
        randomAction,
        currentState.turnPlayer
      );
      moves++;
    }

    // If game didn't end, evaluate state heuristically or return null (draw)
    // For now, return winner if exists, else null
    return currentState.winner;
  }

  // 4. Backpropagation
  private backpropagation(node: MCTSNode, winner: Player | null) {
    let current: MCTSNode | null = node;

    while (current !== null) {
      current.visits++;

      // Update wins
      // If this node represents an action taken by 'me', and 'me' won, increment wins.
      // The 'action' in the node is the action that LED to this state.
      // So if node.action was taken by 'me', and winner is 'me', then it's a win for this node.

      if (current.parent) {
        // The player who took the action to get to 'current' node
        // is the turnPlayer of the PARENT node.
        const playerWhoMoved = current.parent.state.turnPlayer;

        if (winner === playerWhoMoved) {
          current.wins++;
        } else if (winner === null) {
          // Draw - maybe give 0.5? For now 0.
          current.wins += 0.5;
        }
      }

      current = current.parent;
    }
  }

  private getBestUCTChild(node: MCTSNode): MCTSNode {
    let bestChild = node.children[0];
    let bestValue = -Infinity;

    for (const child of node.children) {
      const uct = child.getUCTValue();
      if (uct > bestValue) {
        bestValue = uct;
        bestChild = child;
      }
    }

    return bestChild;
  }

  private getBestChild(node: MCTSNode): MCTSNode {
    // Robust child: most visited
    return node.children.reduce((prev, current) =>
      prev.visits > current.visits ? prev : current
    );
  }
}
