/**
 * 技能載入器
 * Skill Loader - Loads and caches skill data from JSON files
 */

import { CharacterSkill, EventSkill } from "./SkillTypes";

// 技能快取
let characterSkillsCache: CharacterSkill[] | null = null;
let eventSkillsCache: EventSkill[] | null = null;

// 按卡片 ID 索引的技能映射
let characterSkillMap: Map<string, CharacterSkill[]> = new Map();
let eventSkillMap: Map<string, EventSkill[]> = new Map();

/**
 * 載入角色卡技能
 */
export async function loadCharacterSkills(): Promise<CharacterSkill[]> {
  if (characterSkillsCache) {
    return characterSkillsCache;
  }

  try {
    // 在 Node.js 環境中使用 fs，在瀏覽器中使用 fetch
    if (typeof window === "undefined") {
      // Node.js 環境
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(
        process.cwd(),
        "public/skills/character_skills.json"
      );
      const data = fs.readFileSync(filePath, "utf-8");
      characterSkillsCache = JSON.parse(data) as CharacterSkill[];
    } else {
      // 瀏覽器環境 - 使用 Vite 的 BASE_URL
      const baseUrl = (import.meta as any).env?.BASE_URL || "/";
      const url = `${baseUrl}skills/character_skills.json`;
      console.log("[SkillLoader] Loading character skills from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      characterSkillsCache = (await response.json()) as CharacterSkill[];
      console.log(
        "[SkillLoader] Loaded",
        characterSkillsCache.length,
        "character skills"
      );
    }

    // 建立索引
    buildCharacterSkillMap();
    return characterSkillsCache!;
  } catch (error) {
    console.error("Failed to load character skills:", error);
    return [];
  }
}

/**
 * 載入事件卡技能
 */
export async function loadEventSkills(): Promise<EventSkill[]> {
  if (eventSkillsCache) {
    return eventSkillsCache;
  }

  try {
    if (typeof window === "undefined") {
      // Node.js 環境
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(
        process.cwd(),
        "public/skills/event_skills.json"
      );
      const data = fs.readFileSync(filePath, "utf-8");
      eventSkillsCache = JSON.parse(data) as EventSkill[];
    } else {
      // 瀏覽器環境 - 使用 Vite 的 BASE_URL
      const baseUrl = (import.meta as any).env?.BASE_URL || "/";
      const url = `${baseUrl}skills/event_skills.json`;
      console.log("[SkillLoader] Loading event skills from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      eventSkillsCache = (await response.json()) as EventSkill[];
      console.log(
        "[SkillLoader] Loaded",
        eventSkillsCache.length,
        "event skills"
      );
    }

    // 建立索引
    buildEventSkillMap();
    return eventSkillsCache!;
  } catch (error) {
    console.error("Failed to load event skills:", error);
    return [];
  }
}

/**
 * 建立角色卡技能索引
 */
function buildCharacterSkillMap(): void {
  characterSkillMap.clear();
  if (!characterSkillsCache) return;

  for (const skill of characterSkillsCache) {
    const existing = characterSkillMap.get(skill.cardId) || [];
    existing.push(skill);
    characterSkillMap.set(skill.cardId, existing);
  }
}

/**
 * 建立事件卡技能索引
 */
function buildEventSkillMap(): void {
  eventSkillMap.clear();
  if (!eventSkillsCache) return;

  for (const skill of eventSkillsCache) {
    const existing = eventSkillMap.get(skill.cardId) || [];
    existing.push(skill);
    eventSkillMap.set(skill.cardId, existing);
  }
}

/**
 * 根據卡片 ID 獲取角色卡技能
 */
export function getCharacterSkill(cardId: string): CharacterSkill | undefined {
  const skills = characterSkillMap.get(cardId);
  return skills?.[0];
}

/**
 * 根據卡片 ID 獲取事件卡技能
 */
export function getEventSkill(cardId: string): EventSkill | undefined {
  const skills = eventSkillMap.get(cardId);
  return skills?.[0];
}

/**
 * 根據角色名稱搜尋技能
 */
export function findSkillsByName(name: string): CharacterSkill[] {
  if (!characterSkillsCache) return [];
  return characterSkillsCache.filter((s) => s.cardName === name);
}

/**
 * 根據學校搜尋技能
 */
export function findSkillsBySchool(school: string): CharacterSkill[] {
  if (!characterSkillsCache) return [];
  return characterSkillsCache.filter((s) => s.school === school);
}

/**
 * 清除快取（用於測試）
 */
export function clearSkillCache(): void {
  characterSkillsCache = null;
  eventSkillsCache = null;
  characterSkillMap.clear();
  eventSkillMap.clear();
}

/**
 * 同步載入技能（Node.js 環境專用）
 */
async function loadSkillsSyncInternal(): Promise<void> {
  if (typeof window !== "undefined") {
    // 瀏覽器環境不支援同步載入
    return;
  }

  try {
    // Node.js 環境載入
    const fs = await import("fs");
    const path = await import("path");

    if (!characterSkillsCache) {
      const charPath = path.join(
        process.cwd(),
        "public/skills/character_skills.json"
      );
      if (fs.existsSync(charPath)) {
        const data = fs.readFileSync(charPath, "utf-8");
        characterSkillsCache = JSON.parse(data) as CharacterSkill[];
        buildCharacterSkillMap();
      }
    }

    if (!eventSkillsCache) {
      const eventPath = path.join(
        process.cwd(),
        "public/skills/event_skills.json"
      );
      if (fs.existsSync(eventPath)) {
        const data = fs.readFileSync(eventPath, "utf-8");
        eventSkillsCache = JSON.parse(data) as EventSkill[];
        buildEventSkillMap();
      }
    }
  } catch (error) {
    console.error("Failed to load skills:", error);
  }
}

// 導出初始化函數供外部調用
export async function initializeSkills(): Promise<void> {
  if (typeof window === "undefined") {
    // Node.js 環境使用同步載入
    await loadSkillsSyncInternal();
  } else {
    // 瀏覽器環境使用 fetch 載入
    console.log("[SkillLoader] Initializing skills in browser environment...");
    await Promise.all([loadCharacterSkills(), loadEventSkills()]);
    console.log(
      "[SkillLoader] Skills initialized. Character:",
      characterSkillMap.size,
      "Event:",
      eventSkillMap.size
    );
  }
}

// 在 Node.js 環境下自動載入技能
if (typeof window === "undefined") {
  loadSkillsSyncInternal();
}
