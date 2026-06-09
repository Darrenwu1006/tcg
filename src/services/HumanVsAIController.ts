import { GameAction, Player } from "../engine/Actions";
import { GameEngine } from "../engine/GameEngine";
import { EngineGameState } from "../engine/GameState";
import { HeuristicAI } from "../engine/HeuristicAI";
import { Card, AppState, Store } from "../state/Store";
import {
  describeGameAction,
  engineToAppState,
  getPhaseDescription,
} from "./StateConverter";

export interface HumanVsAIConfig {
  meDeck: Card[];
  opponentDeck: Card[];
  firstPlayer: Player;
  meSchool: string;
  opponentSchool: string;
  aiRandomness?: number;
}

export interface HumanVsAIStep {
  player: Player;
  action: GameAction;
  phase: string;
  success: boolean;
  error?: string;
}

export class HumanVsAIController {
  private engine: GameEngine | null = null;
  private opponentAI: HeuristicAI | null = null;

  constructor(private store: Store<AppState>) {}

  start(config: HumanVsAIConfig): void {
    this.engine = new GameEngine(
      [...config.meDeck],
      [...config.opponentDeck],
      config.firstPlayer,
      config.meSchool,
      config.opponentSchool
    );
    this.opponentAI = new HeuristicAI(
      "opponent",
      config.aiRandomness ?? 0.05
    );

    this.syncToStore([
      "Vs Computer 模式啟動",
      `目前階段：${this.getCurrentPhaseLabel()}`,
    ]);
    this.runOpponentUntilHuman();
  }

  getEngineState(): EngineGameState | null {
    return (this.engine?.getState() as EngineGameState | undefined) ?? null;
  }

  getLegalHumanActions(): GameAction[] {
    if (!this.engine) return [];
    const state = this.getEngineState();
    if (!state || state.turnPlayer !== "me") return [];
    return this.engine.getLegalActions("me");
  }

  executeHumanAction(action: GameAction): HumanVsAIStep | null {
    if (!this.engine) return null;

    const beforeState = this.getEngineState();
    const actionLabel = beforeState
      ? describeGameAction(action, beforeState)
      : action.type;
    const result = this.engine.executeAction(action, "me");
    this.syncToStore([`玩家動作：${actionLabel}`]);

    return {
      player: "me",
      action,
      phase: this.getCurrentPhaseLabel(),
      success: result.success,
      error: result.error,
    };
  }

  runOpponentUntilHuman(maxActions: number = 20): HumanVsAIStep[] {
    const steps: HumanVsAIStep[] = [];
    if (!this.engine || !this.opponentAI) return steps;

    let guard = 0;
    while (
      guard < maxActions &&
      !this.engine.isGameOver() &&
      this.getEngineState()?.turnPlayer === "opponent"
    ) {
      const state = this.getEngineState();
      if (!state) break;

      const action = this.opponentAI.selectAction(state);
      const result = this.engine.executeAction(action, "opponent");
      steps.push({
        player: "opponent",
        action,
        phase: this.getCurrentPhaseLabel(),
        success: result.success,
        error: result.error,
      });

      if (!result.success) break;
      guard++;
    }

    if (steps.length > 0) {
      const actionLogs = steps.map((step) => {
        const label = this.getActionLabelAfterStep(step.action);
        return `AI 動作：${label}`;
      });
      this.syncToStore([`AI 已執行 ${steps.length} 個動作`, ...actionLogs]);
    }

    return steps;
  }

  private syncToStore(extraLogs: string[] = []): void {
    const state = this.getEngineState();
    if (!state) return;

    this.store.setState(
      {
        ...engineToAppState(state),
        playMode: "vsComputer",
        selectedCard: null,
        selectedCards: [],
        playingCard: null,
        logs: [...extraLogs, ...state.logs],
      } as Partial<AppState>,
      false
    );
  }

  private getCurrentPhaseLabel(): string {
    const state = this.getEngineState();
    if (!state) return "未開始";
    return getPhaseDescription(state.phase);
  }

  private getActionLabelAfterStep(action: GameAction): string {
    const state = this.getEngineState();
    return state ? describeGameAction(action, state) : action.type;
  }
}
