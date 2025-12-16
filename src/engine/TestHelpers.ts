/**
 * 測試用簡易卡片創建器
 * 為測試創建假卡片數據
 */

import { Card } from "../state/Store";

/**
 * 創建測試用的角色卡
 */
export function createTestCharacterCard(overrides?: Partial<Card>): Card {
  const id = `test-char-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: overrides?.id || id,
    instanceId: `${id}-${Date.now()}`,
    name: overrides?.name || "測試角色",
    school: overrides?.school || "烏野",
    rarity: overrides?.rarity || "N",
    role: overrides?.role || "MB",
    type: "CHARACTER",
    timing: overrides?.timing || "-",
    stats: overrides?.stats || {
      serve: 3,
      block: 3,
      receive: 3,
      toss: 2,
      attack: 3,
    },
    skill: overrides?.skill || "-",
    note: overrides?.note || "-",
    ...overrides,
  };
}

/**
 * 創建一副測試用牌組（40 張）
 */
export function createTestDeck(count: number = 40): Card[] {
  const deck: Card[] = [];

  // 創建各種類型的卡片
  const roles = ["MB", "WS", "S", "Li"];
  const names = ["日向 翔陽", "影山 飛雄", "月島 螢", "西谷 夕", "澤村 大地"];

  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    const name = names[i % names.length];

    // 根據位置設定不同的數值
    let stats;
    switch (role) {
      case "S": // 舉球員
        stats = { serve: 3, block: 1, receive: 2, toss: 2, attack: 1 };
        break;
      case "MB": // 中間攔網
        stats = { serve: 2, block: 3, receive: 2, toss: 0, attack: 3 };
        break;
      case "WS": // 邊攻手
        stats = { serve: 4, block: 2, receive: 4, toss: 0, attack: 3 };
        break;
      case "Li": // 自由球員
        stats = { serve: null, block: null, receive: 6, toss: 0, attack: null };
        break;
      default:
        stats = { serve: 3, block: 3, receive: 3, toss: 2, attack: 3 };
    }

    deck.push(
      createTestCharacterCard({
        name,
        role,
        stats,
      })
    );
  }

  return deck;
}

/**
 * 創建平衡的測試牌組
 * 確保有足夠的各種角色
 */
export function createBalancedTestDeck(): Card[] {
  const deck: Card[] = [];

  // 10 張發球手（高發球值）
  for (let i = 0; i < 10; i++) {
    deck.push(
      createTestCharacterCard({
        name: `發球手${i + 1}`,
        role: "WS",
        stats: { serve: 5, block: 2, receive: 3, toss: 0, attack: 3 },
      })
    );
  }

  // 10 張攔網手（高攔網值）
  for (let i = 0; i < 10; i++) {
    deck.push(
      createTestCharacterCard({
        name: `攔網手${i + 1}`,
        role: "MB",
        stats: { serve: 2, block: 3, receive: 2, toss: 0, attack: 3 },
      })
    );
  }

  // 10 張接球手（高接球值）
  for (let i = 0; i < 10; i++) {
    deck.push(
      createTestCharacterCard({
        name: `接球手${i + 1}`,
        role: "WS",
        stats: { serve: 3, block: 2, receive: 5, toss: 0, attack: 2 },
      })
    );
  }

  // 5 張托球手（托球值）
  for (let i = 0; i < 5; i++) {
    deck.push(
      createTestCharacterCard({
        name: `托球手${i + 1}`,
        role: "S",
        stats: { serve: 3, block: 1, receive: 2, toss: 2, attack: 1 },
      })
    );
  }

  // 5 張攻擊手（高攻擊值）
  for (let i = 0; i < 5; i++) {
    deck.push(
      createTestCharacterCard({
        name: `攻擊手${i + 1}`,
        role: "WS",
        stats: { serve: 3, block: 2, receive: 3, toss: 0, attack: 4 },
      })
    );
  }

  return deck;
}
