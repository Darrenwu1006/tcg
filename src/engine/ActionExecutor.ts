/**
 * 遊戲引擎 - 動作執行器
 * Game Engine - Action Executor
 *
 * 執行合法的動作並更新遊戲狀態
 */

import { Card } from "../state/Store";
import { GameAction, Player, ActionResult } from "./Actions";
import {
  EngineGameState,
  getPlayerState,
  getOpponent,
  addLog,
} from "./GameState";
import { triggerOnPlaySkill, triggerPhaseSkills } from "./SkillTriggerSystem";
import { getCharacterSkill, getEventSkill } from "./SkillLoader";
import { executeSkill, isSkillAvailable } from "./SkillExecutor";

/**
 * 動作執行器
 */
export class ActionExecutor {
  /**
   * 執行動作（會直接修改 state）
   */
  static execute(
    state: EngineGameState,
    action: GameAction,
    player: Player
  ): ActionResult {
    try {
      // Debug: 檢查動作類型
      // Debug: 檢查動作類型
      // if (action.type === "ACTIVATE_SKILL" || action.type === "USE_EVENT") {
      //   console.log(`Executing action: "${action.type}"`);
      // }

      switch (action.type) {
        case "PLAY_SERVE":
          return this.executeServe(state, action.cardInstanceId, player);

        case "CHOOSE_DEFENSE":
          return this.executeDefenseChoice(state, action.choice, player);

        case "PLAY_BLOCK":
          return this.executeBlock(state, action.cardInstanceIds, player);

        case "PLAY_RECEIVE":
          return this.executeReceive(state, action.cardInstanceId, player);

        case "PLAY_TOSS":
          return this.executeToss(state, action.cardInstanceId, player);

        case "PLAY_ATTACK":
          return this.executeAttack(state, action.cardInstanceId, player);

        case "ACTIVATE_SKILL":
          return this.executeActivateSkill(
            state,
            action.cardInstanceId,
            player
          );

        case "USE_EVENT":
          return this.executeUseEvent(state, action.cardInstanceId, player);

        case "MULLIGAN":
          return this.executeMulligan(state, action.cardInstanceIds, player);

        case "DECLARE_LOST":
          return this.executeLost(state, player);

        case "PASS":
          return this.executePass(state, player);

        default:
          console.log(
            `Unknown action type received: "${(action as any).type}"`
          );
          return { success: false, error: "Unknown action type" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 執行發球
   */
  private static executeServe(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);
    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );

    if (cardIndex === -1) {
      return { success: false, error: "Card not found in hand" };
    }

    const card = playerState.hand[cardIndex];

    // 移除手牌中的卡片
    playerState.hand.splice(cardIndex, 1);

    // 放置到場地（發球區）
    card.position = "serve";
    playerState.field.push(card);

    // 觸發登場技能
    triggerOnPlaySkill(state, player, card);

    // 計算發球點數
    const servePoint = card.stats?.serve || 0;
    playerState.currentOP = servePoint;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} ${card.name} 發球，OP=${servePoint}`
    );

    // 進入對手回合，轉換階段
    state.turnPlayer = getOpponent(player);
    state.phase = "start"; // 對手的開始階段（選擇防守方式）
    state.isFirstTurn = false; // 第一回合結束
    state.isFromServe = true; // 當前 OP 來自發球（不能被攔網）

    // 觸發對手開始階段技能
    triggerPhaseSkills(state, getOpponent(player), "start");

    return {
      success: true,
      newPhase: "start",
      logs: state.logs.slice(-1),
    };
  }

  /**
   * 執行防守選擇
   */
  private static executeDefenseChoice(
    state: EngineGameState,
    choice: "block" | "receive",
    player: Player
  ): ActionResult {
    state.defenseChoice = choice;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} 選擇 ${
        choice === "block" ? "攔網" : "接球"
      }`
    );

    if (choice === "block") {
      state.phase = "block";
      return { success: true, newPhase: "block" };
    } else {
      // 接球軸：進入抽牌階段
      state.phase = "draw";
      return { success: true, newPhase: "draw" };
    }
  }

  /**
   * 執行攔網
   */
  private static executeBlock(
    state: EngineGameState,
    cardInstanceIds: string[],
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);
    const opponentState = getPlayerState(state, getOpponent(player));

    // 從手牌移除並放到場地
    const playedCards: Card[] = [];
    let totalBlockPoint = 0;

    for (const id of cardInstanceIds) {
      const cardIndex = playerState.hand.findIndex((c) => c.instanceId === id);
      if (cardIndex === -1) continue;

      const card = playerState.hand.splice(cardIndex, 1)[0];
      card.position = "block";
      playerState.field.push(card);
      playedCards.push(card);

      totalBlockPoint += card.stats?.block || 0;
    }

    playerState.currentDP = totalBlockPoint;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} 攔網 ${playedCards
        .map((c) => c.name)
        .join("+")}，DP=${totalBlockPoint}`
    );

    // 判定：DP vs OP
    const opponentOP = opponentState.currentOP;

    if (totalBlockPoint < opponentOP) {
      // 攔網失敗 → Lost
      addLog(state, `攔網失敗！(DP=${totalBlockPoint} < OP=${opponentOP})`);
      return this.executeLost(state, player);
    } else {
      // 攔網成功
      addLog(state, `攔網成功！(DP=${totalBlockPoint} >= OP=${opponentOP})`);

      // 處理攔網者：中間攔網者（第一張）留在場上變成 guts，側邊攔網者移到棄牌區
      if (playedCards.length > 1) {
        // 有側邊攔網者，只移除他們（跳過第一張）
        for (let i = 1; i < playedCards.length; i++) {
          const card = playedCards[i];
          const fieldIndex = playerState.field.findIndex(
            (c) => c.instanceId === card.instanceId
          );
          if (fieldIndex !== -1) {
            const removed = playerState.field.splice(fieldIndex, 1)[0];
            removed.position = undefined;
            playerState.drop.push(removed);
          }
        }
        addLog(state, `側邊攔網者移到棄牌區`);
      }
      // 中間攔網者（第一張）變成 guts，留在場上
      if (playedCards.length > 0) {
        playedCards[0].position = "guts";
      }

      // 重置點數：攔網成功後 OP 變成 0
      playerState.currentOP = 0;
      playerState.currentDP = 0;
      opponentState.currentOP = 0; // 對手的 OP 變成 0

      // 攔網成功後，對手只能接球（不能攔網）
      // isFromServe 保持原狀（false），表示來自攻擊/攔網，對手只能接球
      // 這裡需要特別設定，因為 OP=0 的攔網反擊也不能被攔網
      state.isFromServe = true; // 攔網成功後等同發球，對手只能接球

      // 進入結束階段
      state.phase = "end";
      return { success: true, newPhase: "end" };
    }
  }

  /**
   * 執行接球
   */
  private static executeReceive(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);
    const opponentState = getPlayerState(state, getOpponent(player));

    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );
    if (cardIndex === -1) {
      return { success: false, error: "Card not found" };
    }

    const card = playerState.hand.splice(cardIndex, 1)[0];
    card.position = "receive";
    playerState.field.push(card);

    // 觸發登場技能
    triggerOnPlaySkill(state, player, card);

    const receivePoint = card.stats?.receive || 0;
    playerState.currentDP = receivePoint;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} ${
        card.name
      } 接球，DP=${receivePoint}`
    );

    // 判定
    const opponentOP = opponentState.currentOP;

    if (receivePoint < opponentOP) {
      // 接球失敗 → Lost
      addLog(state, `接球失敗！(DP=${receivePoint} < OP=${opponentOP})`);
      return this.executeLost(state, player);
    } else {
      // 接球成功 → 進入托球階段
      addLog(state, `接球成功！(DP=${receivePoint} >= OP=${opponentOP})`);
      state.phase = "toss";
      return { success: true, newPhase: "toss" };
    }
  }

  /**
   * 執行托球
   */
  private static executeToss(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);

    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );
    if (cardIndex === -1) {
      return { success: false, error: "Card not found" };
    }

    const card = playerState.hand.splice(cardIndex, 1)[0];
    card.position = "toss";
    playerState.field.push(card);

    // 觸發登場技能
    triggerOnPlaySkill(state, player, card);

    const tossPoint = card.stats?.toss || 0;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} ${
        card.name
      } 托球，Toss=${tossPoint}`
    );

    // 進入攻擊階段
    state.phase = "attack";
    return { success: true, newPhase: "attack" };
  }

  /**
   * 執行攻擊
   */
  private static executeAttack(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);

    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );
    if (cardIndex === -1) {
      return { success: false, error: "Card not found" };
    }

    const card = playerState.hand.splice(cardIndex, 1)[0];
    card.position = "attack";
    playerState.field.push(card);

    // 觸發登場技能
    triggerOnPlaySkill(state, player, card);

    // 計算 OP = Toss + Attack
    const tossCard = playerState.field.find((c) => c.position === "toss");
    const tossPoint = tossCard?.stats?.toss || 0;
    const attackPoint = card.stats?.attack || 0;
    const totalOP = tossPoint + attackPoint;

    playerState.currentOP = totalOP;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} ${
        card.name
      } 攻擊，OP=${totalOP} (${tossPoint}+${attackPoint})`
    );

    // 進入結束階段
    state.phase = "end";
    state.isFromServe = false; // 攻擊的 OP 可以被攔網
    return { success: true, newPhase: "end" };
  }

  /**
   * 執行 Lost
   */
  private static executeLost(
    state: EngineGameState,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);
    const opponentState = getPlayerState(state, getOpponent(player));

    addLog(state, `${player === "me" ? "我方" : "對手"} 宣告 Lost`);

    // 重置點數
    playerState.currentOP = 0;
    playerState.currentDP = 0;
    opponentState.currentOP = 0;
    opponentState.currentDP = 0;

    // 檢查 Set 區
    if (playerState.set.length === 0) {
      // Set 區沒卡了 → 輸掉比賽
      state.gameOver = true;
      state.winner = getOpponent(player);
      addLog(
        state,
        `遊戲結束！${state.winner === "me" ? "我方" : "對手"} 勝利`
      );

      return {
        success: true,
        gameOver: true,
        winner: state.winner,
      };
    }

    // Interval 流程
    // 1. 從 Set 區拿 1 張卡到手牌
    const setCard = playerState.set.pop();
    if (setCard) {
      setCard.position = undefined;
      playerState.hand.push(setCard);
      addLog(state, `${player === "me" ? "我方" : "對手"} 從 Set 區拿 1 張卡`);
    }

    // 2. 雙方補滿手牌至 6 張
    this.fillHand(state, "me");
    this.fillHand(state, "opponent");

    // 3. 場地上的卡片保留（不清空）

    // 4. 贏家獲得發球權，進入新的 Set
    const winner = getOpponent(player);
    state.servePlayer = winner;
    state.turnPlayer = winner;
    state.phase = "serve";
    state.isFirstTurn = true; // 新 Set 的第一回合
    state.isFromServe = true; // 發球

    addLog(state, `新的 Set 開始，${winner === "me" ? "我方" : "對手"} 發球`);

    return {
      success: true,
      newPhase: "serve",
    };
  }

  /**
   * 執行 Pass
   */
  private static executePass(
    state: EngineGameState,
    player: Player
  ): ActionResult {
    // 根據當前階段處理 PASS
    switch (state.phase) {
      case "setup":
        // 調整手牌階段 Pass：不調整手牌
        state.hasMulligan[player] = true;
        addLog(state, `${player === "me" ? "我方" : "對手"} 保持現有手牌`);

        // 檢查是否雙方都已完成調整手牌
        if (state.hasMulligan.me && state.hasMulligan.opponent) {
          state.phase = "serve";
          state.turnPlayer = state.servePlayer!; // 確保由發球者開始
          addLog(state, "雙方完成手牌調整，進入發球階段");
          return { success: true, newPhase: "serve" };
        }

        // 切換到另一位玩家進行 mulligan
        state.turnPlayer = getOpponent(player);
        return { success: true };

      case "draw":
        // 抽牌階段（接球軸）：抽 1 張卡，進入接球階段
        this.drawCards(state, player, 1);
        addLog(state, `${player === "me" ? "我方" : "對手"} 抽牌（接球軸）`);
        state.phase = "receive";
        return { success: true, newPhase: "receive" };

      case "end":
        // 結束階段：切換到對手的開始階段
        state.turnCount++;
        state.turnPlayer = getOpponent(player);
        state.defenseChoice = null;
        state.phase = "start";
        addLog(
          state,
          `回合 ${state.turnCount} 開始，${
            state.turnPlayer === "me" ? "我方" : "對手"
          } 選擇防守`
        );
        return { success: true, newPhase: "start" };

      default:
        // 其他階段的 PASS 不應該發生
        addLog(state, `${player === "me" ? "我方" : "對手"} Pass`);
        return { success: true };
    }
  }

  /**
   * 幫助方法：抽卡
   */
  private static drawCards(
    state: EngineGameState,
    player: Player,
    count: number
  ): void {
    const playerState = getPlayerState(state, player);

    for (let i = 0; i < count; i++) {
      if (playerState.deck.length === 0) break;

      const card = playerState.deck.shift();
      if (card) {
        card.position = undefined;
        playerState.hand.push(card);
      }
    }

    if (count > 0) {
      addLog(state, `${player === "me" ? "我方" : "對手"} 抽 ${count} 張卡`);
    }
  }

  /**
   * 幫助方法：補滿手牌至 6 張
   */
  private static fillHand(state: EngineGameState, player: Player): void {
    const playerState = getPlayerState(state, player);
    const needed = 6 - playerState.hand.length;
    if (needed > 0) {
      this.drawCards(state, player, needed);
    }
  }

  /**
   * 執行角色技能
   */
  private static executeActivateSkill(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    // const { getCharacterSkill } = require("./SkillLoader");
    // const { executeSkill, isSkillAvailable } = require("./SkillExecutor");

    const playerState = getPlayerState(state, player);

    // 找到卡片
    const card = playerState.field.find((c) => c.instanceId === cardInstanceId);
    if (!card) {
      return { success: false, error: "Card not found on field" };
    }

    // 獲取技能資料
    const skill = getCharacterSkill(card.id);
    if (!skill) {
      return { success: false, error: "No skill data for this card" };
    }

    // 檢查技能是否可用
    const availability = isSkillAvailable(state, player, skill);
    if (!availability.available) {
      return { success: false, error: availability.reason };
    }

    // 執行技能
    const result = executeSkill(state, player, skill, card);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    addLog(state, `${player === "me" ? "我方" : "對手"} ${card.name} 發動技能`);

    return { success: true };
  }

  /**
   * 執行事件卡
   */
  private static executeUseEvent(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    // const { getEventSkill } = require("./SkillLoader");
    // const { executeSkill, isSkillAvailable } = require("./SkillExecutor");

    const playerState = getPlayerState(state, player);

    // 從手牌找到事件卡
    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );
    if (cardIndex === -1) {
      return { success: false, error: "Event card not found in hand" };
    }

    const card = playerState.hand[cardIndex];
    if (card.type !== "EVENT") {
      return { success: false, error: "Card is not an event card" };
    }

    // 獲取技能資料
    const skill = getEventSkill(card.id);
    if (!skill) {
      return { success: false, error: "No skill data for this event" };
    }

    // 檢查技能是否可用
    const availability = isSkillAvailable(state, player, skill);
    if (!availability.available) {
      return { success: false, error: availability.reason };
    }

    // 從手牌移除並放到事件區（或棄牌區）
    playerState.hand.splice(cardIndex, 1);
    card.position = "event";
    playerState.drop.push(card); // 使用後進入棄牌區

    // 執行技能
    const result = executeSkill(state, player, skill);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} 使用事件卡 ${card.name}`
    );

    return { success: true };
  }

  /**
   * 執行調整手牌（引き直し）
   */
  private static executeMulligan(
    state: EngineGameState,
    cardInstanceIds: string[],
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);

    // 如果已經調整過手牌，不能再調整
    if (state.hasMulligan[player]) {
      return { success: false, error: "Already used mulligan" };
    }

    // 將選擇的卡片放回牌組
    const count = cardInstanceIds.length;
    for (const id of cardInstanceIds) {
      const cardIndex = playerState.hand.findIndex((c) => c.instanceId === id);
      if (cardIndex !== -1) {
        const card = playerState.hand.splice(cardIndex, 1)[0];
        card.position = undefined;
        playerState.deck.push(card);
      }
    }

    // 洗牌
    for (let i = playerState.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerState.deck[i], playerState.deck[j]] = [
        playerState.deck[j],
        playerState.deck[i],
      ];
    }

    // 補滿手牌至 6 張
    while (playerState.hand.length < 6 && playerState.deck.length > 0) {
      const card = playerState.deck.pop();
      if (card) {
        card.position = undefined;
        playerState.hand.push(card);
      }
    }

    // 標記已完成調整手牌
    state.hasMulligan[player] = true;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} 調整手牌，放回 ${count} 張`
    );

    // 檢查是否雙方都已完成調整手牌
    if (state.hasMulligan.me && state.hasMulligan.opponent) {
      state.phase = "serve";
      state.turnPlayer = state.servePlayer!; // 確保由發球者開始
      addLog(state, "雙方完成手牌調整，進入發球階段");
      return { success: true, newPhase: "serve" };
    }

    // 切換到另一位玩家進行 mulligan
    state.turnPlayer = getOpponent(player);
    return { success: true };
  }

  /**
   * 清理回合結束時的持續效果
   */
  static cleanupTurnEffects(state: EngineGameState): void {
    // 移除 duration 為 "turn" 的效果
    state.activeEffects = state.activeEffects.filter(
      (effect) => effect.duration !== "turn"
    );

    addLog(state, "清理回合持續效果");
  }

  /**
   * 清理 Set 結束時的持續效果
   */
  static cleanupSetEffects(state: EngineGameState): void {
    // 移除 duration 為 "set" 的效果
    state.activeEffects = state.activeEffects.filter(
      (effect) => effect.duration === "permanent"
    );

    addLog(state, "清理 Set 持續效果");
  }
}
