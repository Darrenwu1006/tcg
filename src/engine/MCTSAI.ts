/**
 * MCTS AI Wrapper
 * 蒙地卡羅樹搜索 AI 封裝
 */

import { EngineGameState } from "./GameState";
import { GameAction } from "./Actions";
import { MCTS, MCTSLogLevel } from "./MCTS";

export class MCTSAI {
  private mcts: MCTS;
  private simulations: number;

  constructor(
    simulations: number = 1000,
    logLevel: MCTSLogLevel = MCTSLogLevel.DETAILED
  ) {
    this.mcts = new MCTS(logLevel);
    this.simulations = simulations;
  }

  public selectAction(state: EngineGameState): GameAction {
    const result = this.mcts.selectAction(state, this.simulations);
    return result.action;
  }

  public selectActionWithStats(state: EngineGameState): {
    action: GameAction;
    winRate: number;
  } {
    return this.mcts.selectAction(state, this.simulations);
  }
}
