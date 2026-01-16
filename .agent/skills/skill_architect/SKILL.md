---
name: Skill Architect
description: End-to-end workflow for designing, implementing, and standardizing card skills in BreakTCG.
dates:
  created: 2025-01-16
---

# Skill Architect

This skill provides a standardized workflow for adding new card skills to the game, ensuring they are correctly defined in CSV, standardized into JSON, and implemented in the game engine.

## Workflow Overview

1.  **Define**: Add card data to the master CSV.
2.  **Standardize**: Use the analysis script to generate structured JSON.
3.  **Integrate**: Ensure the game engine loads the skill definition.
4.  **Implement**: Add any missing condition or effect logic to the engine.
5.  **Verify**: Test the skill in-game.

---

## Step 1: Define Card (CSV)

All character cards are defined in `public/pool/All_Characters.csv`.
**Action**:

1.  Open `public/pool/All_Characters.csv`.
2.  Add a new row for the card. Ensure all columns match the format:
    `School,Type,ID,Name,Timing,Rarity,Role,Serve,Block,Receive,Toss,Attack,Skill,Note`
    - **Type**: Must be `CHARACTER` or `EVENT` (Event deck is separate).
    - **Skill**: The raw text description of the skill.

## Step 2: Standardize Skill (Process Script)

Convert the raw text into structured JSON using the existing script.

**Action**:

1.  Run the processing script for the specific school:
    ```bash
    npx tsx scripts/process-character-skills.ts [SchoolName]
    ```
    - Example: `npx tsx scripts/process-character-skills.ts 烏野`
2.  The script uses **Google Gemini API** to parse the skill.
    - Ensure you have a `.env` file with `GEMINI_API_KEY`.
3.  **Automatic Merge**: The script will automatically merge the generated `character_skills_[School].json` into the master `public/skills/character_skills.json`.
4.  **Output Check**: Check `public/skills/character_skills.json`.
    - Verify `parsed: true`.
    - **CRITICAL**: Verify `trigger.condition` uses standardized codes (e.g., `hand_count_under:3`) and NOT natural language.

## Step 3: Integrate Skill (Load Check)

The game engine uses `src/engine/SkillLoader.ts` to load `public/skills/character_skills.json` and `public/skills/event_skills.json`.

**Action**:

1.  Verify that `SkillLoader.ts` is imported and initialized in `main.ts` or `GameEngine.ts` (usually handled automatically).
2.  If adding a new _type_ of skill file (e.g. `stage_skills.json`), ensure `SkillLoader.ts` is updated to fetch it.

## Step 4: Implement Logic (Engine Update)

If the standardized JSON contains new conditions or effects not yet supported by `SkillExecutor.ts`, you must implement them.

**Action**:

1.  **Check Condition**: Open `src/engine/SkillExecutor.ts`.
    - Look at `checkTriggerCondition`.
    - Supported codes include:
      - `hand_count_under:N`, `op_under:N`
      - `all_characters_school:NAME`
      - `character_is:NAME`, `stack_on:NAME`
      - `is_first_turn`, `is_serve_turn`
    - If your skill needs a new condition (e.g., `turn_count_is:3`), add it here.
2.  **Check Effect**: Look at `executeEffect`.
    - Does the `effect.type` exist?
    - Does the `effect.subtype` (for `special`) exist in `executeSpecial`?
    - If **NO**: Add the logic.

## Step 5: Verification

**Action**:

1.  Run the game (or `npm run test` if applicable).
2.  Create a test deck involving the new card.
3.  Verify the skill triggers at the right time and has the right effect.

---

## Troubleshooting

- **Gemini Parsing Fail**: If the script fails to parse, manually edit the JSON in `public/skills/` or refine the prompt in `scripts/process-character-skills.ts`.
- **Skill Not Triggering**:
  - Check `SkillExecutor.ts` -> `isSkillAvailable`.
  - Add `console.log` in `checkTriggerCondition` to see why it returns false.
