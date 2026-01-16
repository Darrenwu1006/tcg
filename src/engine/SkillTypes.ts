/**
 * 技能系統類型定義
 * Skill System Type Definitions
 */

// ============================================================================
// 觸發條件 (Trigger)
// ============================================================================

/** 觸發時機 */
export type SkillTiming =
  | "on_play" // 登場時
  | "serve" // 發球階段
  | "block" // 攔網階段
  | "receive" // 接球階段
  | "toss" // 托球階段
  | "attack" // 攻擊階段
  | "draw" // 抽牌階段
  | "any"; // 任何時機

/** 觸發條件 */
export interface SkillTrigger {
  timing: SkillTiming | string;
  condition?: string;
}

// ============================================================================
// 費用 (Cost)
// ============================================================================

/** 費用類型 */
export type CostType =
  | "none" // 無費用
  | "guts" // 支付 Guts
  | "discard"; // 棄牌

/** 費用定義 */
export interface SkillCost {
  type: CostType | string;
  amount: number | string;
  description?: string;
}

// ============================================================================
// 效果 (Effect)
// ============================================================================

/** 效果類型 */
export type EffectType =
  | "stat_boost" // 數值加成
  | "draw" // 抽牌
  | "discard" // 棄牌
  | "search" // 搜尋牌組
  | "retrieve" // 從棄牌區回收
  | "special"; // 特殊效果

/** 目標類型 */
export type TargetType =
  | "self" // 自己的角色
  | "opponent" // 對手
  | "all" // 所有角色
  | string; // 特定條件

/** 可加成的數值 */
export type StatType =
  | "serve" // 發球點數
  | "block" // 攔網點數
  | "receive" // 接球點數
  | "toss" // 托球點數
  | "attack" // 攻擊點數
  | "any" // 任意數值
  | string;

/** 效果定義 */
export interface SkillEffect {
  type: EffectType | string;
  target?: TargetType;
  stat?: StatType;
  value?: number | string;
  condition?: string;
  amount?: number;
  from?: string;
  to?: string;
  order?: number;
  duration?: string;
  filter?: string;
  card?: string; // 搜尋的卡片名稱
  selector?: string;
  subtype?: string;
  optional?: boolean;
  visibility?: string;
}

// ============================================================================
// 技能定義 (Skill Definition)
// ============================================================================

/** 角色卡技能 */
export interface CharacterSkill {
  cardId: string;
  cardName: string;
  school: string;
  rarity: string;
  role?: string;
  timing: string;
  originalText: string;
  trigger: SkillTrigger;
  cost: SkillCost;
  effects: SkillEffect[];
  parsed: boolean;
}

/** 事件卡技能 */
export interface EventSkill {
  cardId: string;
  cardName: string;
  school: string;
  rarity: string;
  timing: string;
  originalText: string;
  trigger: SkillTrigger;
  cost: SkillCost;
  effects: SkillEffect[];
  parsed: boolean;
}

// ============================================================================
// 運行時技能狀態
// ============================================================================

/** 技能可用性 */
export interface SkillAvailability {
  available: boolean;
  reason?: string;
}

/** 技能執行結果 */
export interface SkillExecutionResult {
  success: boolean;
  error?: string;
  effects?: AppliedEffect[];
}

/** 已應用的效果 */
export interface AppliedEffect {
  type: EffectType;
  target: string;
  value: number | string;
  description: string;
}
