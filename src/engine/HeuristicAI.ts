/**
 * 啟發式 AI
 * Heuristic AI - Rule-based intelligent decision making
 *
 * 設計原則：
 * 1. 評估局勢優劣
 * 2. 評分每個動作
 * 3. 選擇最優動作（加入少量隨機性）
 */

import { GameAction, Player } from "./Actions";
import { EngineGameState, getPlayerState, getOpponent } from "./GameState";
import { RuleValidator } from "./RuleValidator";
import { getCharacterSkill, getEventSkill } from "./SkillLoader";
import { Card } from "../state/Store";

// ============================================================================
// 評分權重配置
// ============================================================================

const WEIGHTS = {
  // 局勢評估權重
  handAdvantage: 0.5, // 手牌優勢
  setAdvantage: 2.0, // Set 卡優勢（非常重要）
  gutsAdvantage: 0.3, // Guts 優勢
  opDpAdvantage: 0.2, // OP/DP 優勢

  // 動作評分權重
  coreActionBase: 10.0, // 核心動作基礎分（PLAY_SERVE, PLAY_RECEIVE 等）
  statValue: 1.0, // 點數價值
  roleFlexibility: 0.5, // 角色靈活性（多功能角色保留價值）
  survivalBonus: 0.3, // 確保存活獎勵

  // 技能/事件獎勵（降低優先級，作為輔助選項）
  skillActivationBonus: 1.5, // 發動技能獎勵（降低）
  eventUsageBonus: 1.0, // 使用事件卡獎勵（降低）
  drawEffectBonus: 0.5, // 抽牌效果加成
  statBoostBonus: 0.3, // 加點效果加成
};

// ============================================================================
// 狀態評估
// ============================================================================

/**
 * 評估遊戲狀態對指定玩家的有利程度
 * @returns 正數表示有利，負數表示不利
 */
export function evaluateGameState(
  state: EngineGameState,
  player: Player
): number {
  const playerState = getPlayerState(state, player);
  const opponentState = getPlayerState(state, getOpponent(player));

  let score = 0;

  // 手牌優勢
  score +=
    (playerState.hand.length - opponentState.hand.length) *
    WEIGHTS.handAdvantage;

  // Set 卡優勢（剩餘 Set 卡越多越好）
  score +=
    (playerState.set.length - opponentState.set.length) * WEIGHTS.setAdvantage;

  // Guts 優勢（場上角色可提供的 Guts）
  const myGuts =
    playerState.field.filter((c) => c.type === "CHARACTER").length * 2;
  const oppGuts =
    opponentState.field.filter((c) => c.type === "CHARACTER").length * 2;
  score += (myGuts - oppGuts) * WEIGHTS.gutsAdvantage;

  // OP/DP 優勢
  score +=
    (playerState.currentOP - opponentState.currentOP) * WEIGHTS.opDpAdvantage;

  return score;
}

// ============================================================================
// 動作評分
// ============================================================================

/**
 * 評分單個動作
 */
export function scoreAction(
  state: EngineGameState,
  player: Player,
  action: GameAction
): number {
  const playerState = getPlayerState(state, player);
  const opponentState = getPlayerState(state, getOpponent(player));

  switch (action.type) {
    case "PLAY_SERVE":
      return scoreServe(playerState, action.cardInstanceId);

    case "PLAY_RECEIVE":
      return scoreReceive(playerState, opponentState, action.cardInstanceId);

    case "PLAY_TOSS":
      return scoreToss(playerState, action.cardInstanceId);

    case "PLAY_ATTACK":
      return scoreAttack(state, player, action.cardInstanceId);

    case "PLAY_BLOCK":
      return scoreBlock(playerState, opponentState, action.cardInstanceIds);

    case "CHOOSE_DEFENSE":
      return scoreDefenseChoice(state, player, action.choice);

    case "ACTIVATE_SKILL":
      return scoreSkillActivation(state, player, action.cardInstanceId);

    case "USE_EVENT":
      return scoreEventUsage(state, player, action.cardInstanceId);

    case "DECLARE_LOST":
      return -100; // 最不想要的選擇

    case "PASS":
      return 0; // 中立

    default:
      return 0;
  }
}

/**
 * 評分發球動作
 */
function scoreServe(playerState: any, cardInstanceId: string): number {
  const card = playerState.hand.find(
    (c: Card) => c.instanceId === cardInstanceId
  );
  if (!card || !card.stats) return 0;

  const servePoint = card.stats.serve || 0;
  // 核心動作基礎分 + 點數加成
  let score = WEIGHTS.coreActionBase + servePoint * WEIGHTS.statValue;

  // 角色靈活性評估：如果這張卡在其他位置也有用，減少使用優先級
  // 保留多功能角色給更需要的位置
  const otherRoles = countOtherRoles(card.stats);
  if (otherRoles >= 2) {
    // 多功能角色，降低發球優先級（保留給其他位置）
    score -= otherRoles * WEIGHTS.roleFlexibility;
  }

  // 發球點數太低可能直接被接，降低評分
  if (servePoint <= 2) {
    score -= 1.0;
  }

  return score;
}

/**
 * 評分接球動作
 */
function scoreReceive(
  playerState: any,
  opponentState: any,
  cardInstanceId: string
): number {
  const card = playerState.hand.find(
    (c: Card) => c.instanceId === cardInstanceId
  );
  if (!card || !card.stats) return 0;

  const receivePoint = card.stats.receive || 0;
  const opponentOP = opponentState.currentOP;

  // 基礎分數：核心動作 + 接球點數
  let score = WEIGHTS.coreActionBase + receivePoint * WEIGHTS.statValue;

  // 能否接住：如果接球點數 >= 對手 OP，大加分
  if (receivePoint >= opponentOP) {
    score += 5.0; // 能接住的優先
  } else {
    // 接不住，減分（但可能沒有其他選擇）
    score -= (opponentOP - receivePoint) * 0.5;
  }

  // 多功能角色保留
  const otherRoles = countOtherRoles(card.stats, "receive");
  if (otherRoles >= 2) {
    score -= otherRoles * WEIGHTS.roleFlexibility * 0.5;
  }

  return score;
}

/**
 * 評分托球動作
 */
function scoreToss(playerState: any, cardInstanceId: string): number {
  const card = playerState.hand.find(
    (c: Card) => c.instanceId === cardInstanceId
  );
  if (!card || !card.stats) return 0;

  const tossPoint = card.stats.toss || 0;
  // 核心動作基礎分 + 托球點數
  let score = WEIGHTS.coreActionBase + tossPoint * WEIGHTS.statValue;

  // 考慮後續攻擊潛力
  // 查看手牌中最高攻擊點數
  const maxAttack = playerState.hand
    .filter(
      (c: Card) =>
        c.type === "CHARACTER" &&
        c.stats?.attack != null &&
        c.name !== card.name
    )
    .reduce((max: number, c: Card) => Math.max(max, c.stats?.attack || 0), 0);

  // 總 OP 潛力
  score += (tossPoint + maxAttack) * 0.3;

  return score;
}

/**
 * 評分攻擊動作
 */
function scoreAttack(
  state: EngineGameState,
  player: Player,
  cardInstanceId: string
): number {
  const playerState = getPlayerState(state, player);
  const opponentState = getPlayerState(state, getOpponent(player));

  const card = playerState.hand.find(
    (c: Card) => c.instanceId === cardInstanceId
  );
  if (!card || !card.stats) return 0;

  const attackPoint = card.stats.attack || 0;
  const tossCard = playerState.field.find((c: Card) => c.position === "toss");
  const tossPoint = tossCard?.stats?.toss || 0;
  const totalOP = attackPoint + tossPoint;
  // 核心動作基礎分 + 總 OP
  let score = WEIGHTS.coreActionBase + totalOP * WEIGHTS.statValue;

  // 對手手牌少，更難防守
  if (opponentState.hand.length <= 3) {
    score += 2.0;
  }

  // 高 OP 更可能得分
  if (totalOP >= 5) {
    score += 2.0;
  }

  return score;
}

/**
 * 評分攔網動作
 */
function scoreBlock(
  playerState: any,
  opponentState: any,
  cardInstanceIds: string[]
): number {
  let totalBlock = 0;

  for (const id of cardInstanceIds) {
    const card = playerState.hand.find((c: Card) => c.instanceId === id);
    if (card?.stats?.block) {
      totalBlock += card.stats.block;
    }
  }

  const opponentOP = opponentState.currentOP;

  // 能否攔住
  if (totalBlock >= opponentOP) {
    return 5.0 + totalBlock * 0.5; // 能攔住大加分
  } else {
    // 攔不住但消耗了卡片
    return totalBlock * 0.3 - cardInstanceIds.length * 0.5;
  }
}

/**
 * 評分防守選擇
 */
function scoreDefenseChoice(
  state: EngineGameState,
  player: Player,
  choice: "block" | "receive"
): number {
  const playerState = getPlayerState(state, player);
  const opponentState = getPlayerState(state, getOpponent(player));
  const opponentOP = opponentState.currentOP;

  // 統計手牌中的攔網和接球能力
  const blockCards = playerState.hand.filter(
    (c: Card) => c.type === "CHARACTER" && c.stats?.block != null
  );
  const receiveCards = playerState.hand.filter(
    (c: Card) => c.type === "CHARACTER" && c.stats?.receive != null
  );

  const maxBlock = blockCards.reduce(
    (sum: number, c: Card) => sum + (c.stats?.block || 0),
    0
  );
  const maxReceive = receiveCards.reduce(
    (max: number, c: Card) => Math.max(max, c.stats?.receive || 0),
    0
  );

  if (choice === "block") {
    // 攔網需要多張卡，但成功後對手直接失分
    if (maxBlock >= opponentOP && blockCards.length <= 2) {
      return 4.0; // 能用少量卡片攔住
    }
    return maxBlock >= opponentOP ? 2.0 : 0.5;
  } else {
    // 接球只需一張卡，但需要後續托球攻擊
    if (maxReceive >= opponentOP) {
      return 3.0;
    }
    return maxReceive >= opponentOP * 0.8 ? 1.5 : 0.5;
  }
}

/**
 * 評分技能發動
 */
function scoreSkillActivation(
  state: EngineGameState,
  player: Player,
  cardInstanceId: string
): number {
  const playerState = getPlayerState(state, player);
  const card = playerState.field.find(
    (c: Card) => c.instanceId === cardInstanceId
  );
  if (!card) return 0;

  const skill = getCharacterSkill(card.id);
  if (!skill) return 0;

  let score = WEIGHTS.skillActivationBonus; // 基礎獎勵

  // 根據效果類型加分
  for (const effect of skill.effects) {
    switch (effect.type) {
      case "draw":
        score += WEIGHTS.drawEffectBonus;
        break;
      case "stat_boost":
        score += WEIGHTS.statBoostBonus;
        break;
      case "discard":
        if (effect.target === "opponent") {
          score += 1.5; // 讓對手棄牌
        }
        break;
    }
  }

  return score;
}

/**
 * 評分事件卡使用
 */
function scoreEventUsage(
  state: EngineGameState,
  player: Player,
  cardInstanceId: string
): number {
  const playerState = getPlayerState(state, player);
  const card = playerState.hand.find(
    (c: Card) => c.instanceId === cardInstanceId
  );
  if (!card) return 0;

  const skill = getEventSkill(card.id);
  if (!skill) return 0;

  let score = WEIGHTS.eventUsageBonus; // 基礎獎勵

  // 根據效果類型加分
  for (const effect of skill.effects) {
    switch (effect.type) {
      case "draw":
        score += WEIGHTS.drawEffectBonus;
        break;
      case "stat_boost":
        score += WEIGHTS.statBoostBonus;
        break;
      case "retrieve":
        score += 1.5; // 回收卡片
        break;
    }
  }

  return score;
}

// ============================================================================
// 輔助函數
// ============================================================================

/**
 * 計算角色在其他位置的可用數量
 */
function countOtherRoles(stats: any, exclude?: string): number {
  let count = 0;
  const roles = ["serve", "block", "receive", "toss", "attack"];

  for (const role of roles) {
    if (role !== exclude && stats[role] != null && stats[role] > 0) {
      count++;
    }
  }

  return count;
}

// ============================================================================
// 動作選擇
// ============================================================================

/**
 * 選擇最佳動作
 * @param randomness 隨機性 (0-1)，0 = 完全確定性，1 = 完全隨機
 */
export function selectBestAction(
  state: EngineGameState,
  player: Player,
  randomness: number = 0.1
): GameAction {
  const actions = RuleValidator.getLegalActions(state, player);

  if (actions.length === 0) {
    throw new Error("No legal actions available");
  }

  if (actions.length === 1) {
    return actions[0];
  }

  // 評分所有動作
  const scoredActions = actions.map((action) => ({
    action,
    score: scoreAction(state, player, action),
  }));

  // 按分數排序
  scoredActions.sort((a, b) => b.score - a.score);

  // 加入隨機性：從前幾名中選擇
  if (randomness > 0 && Math.random() < randomness) {
    // 從前 3 名中隨機選擇（如果有的話）
    const topN = Math.min(3, scoredActions.length);
    const randomIndex = Math.floor(Math.random() * topN);
    return scoredActions[randomIndex].action;
  }

  // 返回最高分動作
  return scoredActions[0].action;
}

/**
 * AI 玩家類別
 */
export class HeuristicAI {
  private randomness: number;
  private player: Player;

  constructor(player: Player, randomness: number = 0.1) {
    this.player = player;
    this.randomness = randomness;
  }

  /**
   * 選擇動作
   */
  selectAction(state: EngineGameState): GameAction {
    return selectBestAction(state, this.player, this.randomness);
  }

  /**
   * 獲取所有動作的評分（用於調試）
   */
  getActionScores(
    state: EngineGameState,
    player: Player
  ): { action: GameAction; score: number }[] {
    const actions = RuleValidator.getLegalActions(state, player);
    return actions.map((action) => ({
      action,
      score: scoreAction(state, player, action),
    }));
  }

  /**
   * 評估當前局勢
   */
  evaluateState(state: EngineGameState, player: Player): number {
    return evaluateGameState(state, player);
  }
}
