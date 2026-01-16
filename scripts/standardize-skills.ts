import fs from "fs";
import path from "path";

const charSkillsPath = path.join(
  process.cwd(),
  "public/skills/character_skills.json"
);
const eventSkillsPath = path.join(
  process.cwd(),
  "public/skills/event_skills.json"
);

function standardizeCondition(condition: string): string {
  if (
    !condition ||
    condition === "無" ||
    condition === "none" ||
    condition === ""
  )
    return "none";

  // Already standardized
  if (condition.includes(":")) return condition;
  if (condition === "guts_is_odd") return condition;

  let c = condition;

  // Hand count
  const handUnder = c.match(/手牌.*?(\d+).*?以下/);
  if (handUnder) return `hand_count_under:${handUnder[1]}`;

  const handOver = c.match(/手牌.*?(\d+).*?以上/);
  if (handOver) return `hand_count_over:${handOver[1]}`;

  // OP
  const opUnder = c.match(/(?:進攻點數|OP).*?(\d+).*?以下/i);
  if (opUnder) return `op_under:${opUnder[1]}`;

  const opOver = c.match(/(?:進攻點數|OP).*?(\d+).*?以上/i);
  if (opOver) return `op_over:${opOver[1]}`;

  // School
  if (
    c.includes("所有角色皆為") ||
    c.includes("所有的角色皆為") ||
    c.includes("school is")
  ) {
    const schoolMatch =
      c.match(/<(.+?)>/) || c.match(/'(.+?)'/) || c.match(/school is '(.+?)'/);
    if (schoolMatch) return `all_characters_school:${schoolMatch[1]}`;
    if (c.includes("梟谷")) return `all_characters_school:梟谷`;
    if (c.includes("烏野")) return `all_characters_school:烏野`;
    if (c.includes("青葉城西")) return `all_characters_school:青葉城西`;
    if (c.includes("音駒")) return `all_characters_school:音駒`;
  }

  // Guts
  if (c.includes("guts") && (c.includes("odd") || c.includes("奇數")))
    return "guts_is_odd";

  // Character Name
  if (c.includes("角色是") || c.includes("角色為")) {
    const nameMatch = c.match(/「(.+?)」/);
    if (nameMatch) return `character_is:${nameMatch[1]}`;
  }

  // Stack On
  if (c.includes("stack_on '")) {
    const match = c.match(/stack_on '(.+?)'/);
    if (match) return `stack_on:${match[1]}`;
  }

  // Stack On Self
  if (c.includes("stack_on_self '")) {
    const match = c.match(/stack_on_self '(.+?)'/);
    if (match) return `stack_on_self:${match[1]}`;
  }

  // Stack On Self School
  if (c.includes("stack_on_self school '")) {
    const match = c.match(/stack_on_self school '(.+?)'/);
    if (match) return `stack_on_self_school:${match[1]}`;
  }

  // Toss Point
  if (c.includes("toss_point >")) {
    const match = c.match(/toss_point > (\d+)/);
    if (match) return `toss_point_over:${match[1]}`;
  }

  // Fallback for manual review if needed, but try to catch all knowns
  return c;
}

function processFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const skills = JSON.parse(content);
  let updatedCount = 0;

  const updatedSkills = skills.map((skill: any) => {
    const oldCondition = skill.trigger.condition;
    const newCondition = standardizeCondition(oldCondition);

    if (oldCondition !== newCondition) {
      console.log(`[${skill.cardId}] ${oldCondition} -> ${newCondition}`);
      skill.trigger.condition = newCondition;
      updatedCount++;
    }
    return skill;
  });

  fs.writeFileSync(filePath, JSON.stringify(updatedSkills, null, 2), "utf-8");
  console.log(`Updated ${updatedCount} skills in ${path.basename(filePath)}`);
}

console.log("Starting standardization...");
processFile(charSkillsPath);
processFile(eventSkillsPath);
console.log("Done.");
