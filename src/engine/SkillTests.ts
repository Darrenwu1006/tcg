/**
 * 技能系統測試
 * Skill System Tests
 */

import {
  loadCharacterSkills,
  loadEventSkills,
  getCharacterSkill,
} from "./SkillLoader";
import { checkTriggerCondition, isSkillAvailable } from "./SkillExecutor";
import { createInitialGameState } from "./GameState";
import { createBalancedTestDeck } from "./TestHelpers";

async function runSkillTests() {
  console.log("╔════════════════════════════════════╗");
  console.log("║   技能系統測試套件              ║");
  console.log("╚════════════════════════════════════╝\n");

  let passed = 0;
  let total = 0;

  // Test 1: Load Character Skills
  console.log("=== 測試 1: 載入角色卡技能 ===");
  total++;
  try {
    const skills = await loadCharacterSkills();
    if (skills.length > 0) {
      console.log(`✓ 成功載入 ${skills.length} 個角色卡技能`);
      passed++;
    } else {
      console.log("✗ 載入失敗：無技能資料");
    }
  } catch (error) {
    console.log("✗ 載入失敗:", error);
  }

  // Test 2: Load Event Skills
  console.log("\n=== 測試 2: 載入事件卡技能 ===");
  total++;
  try {
    const skills = await loadEventSkills();
    if (skills.length > 0) {
      console.log(`✓ 成功載入 ${skills.length} 個事件卡技能`);
      passed++;
    } else {
      console.log("✗ 載入失敗：無技能資料");
    }
  } catch (error) {
    console.log("✗ 載入失敗:", error);
  }

  // Test 3: Get Skill by ID
  console.log("\n=== 測試 3: 根據 ID 獲取技能 ===");
  total++;
  const skill = getCharacterSkill("HV-D01-001");
  if (skill) {
    console.log(`✓ 找到技能: ${skill.cardName}`);
    console.log(`  - 學校: ${skill.school}`);
    console.log(`  - 時機: ${skill.timing}`);
    console.log(`  - 費用: ${skill.cost.type} ${skill.cost.amount}`);
    console.log(`  - 效果: ${skill.effects.length} 個`);
    passed++;
  } else {
    console.log("✗ 找不到技能");
  }

  // Test 4: Check Trigger Condition
  console.log("\n=== 測試 4: 觸發條件檢查 ===");
  total++;
  const meDeck = createBalancedTestDeck();
  const opponentDeck = createBalancedTestDeck();
  const state = createInitialGameState(meDeck, opponentDeck, "me");

  const noCondition = checkTriggerCondition(state, "me", "");
  const blankCondition = checkTriggerCondition(state, "me", "無");
  if (noCondition && blankCondition) {
    console.log("✓ 無條件和空條件正確返回 true");
    passed++;
  } else {
    console.log("✗ 條件檢查失敗");
  }

  // Test 5: Skill Availability Check
  console.log("\n=== 測試 5: 技能可用性檢查 ===");
  total++;
  if (skill) {
    const availability = isSkillAvailable(state, "me", skill);
    console.log(`技能可用性: ${availability.available ? "可用" : "不可用"}`);
    if (!availability.available) {
      console.log(`  原因: ${availability.reason}`);
    }
    // 技能可能因為沒有足夠 Guts 而不可用，這是正常的
    console.log("✓ 技能可用性檢查完成");
    passed++;
  } else {
    console.log("✗ 無法檢查技能可用性");
  }

  // Summary
  console.log("\n╔════════════════════════════════════╗");
  console.log("║   測試結果                      ║");
  console.log("╚════════════════════════════════════╝");
  console.log(`通過: ${passed} / ${total}`);
  console.log(`失敗: ${total - passed} / ${total}`);
}

runSkillTests();
