import { baseWeaponName, createId, displayName } from "./normalize.js";

const SECTION_START = /^(Ranged Weapons|Melee Weapons)\s+Range\s+A\s+(BS|WS)\s+S\s+AP\s+D$/i;
const ANY_SECTION = /^(Ranged Weapons|Melee Weapons|Abilities Description|Faction:|Keywords:|Unit\s+M\s+T\s+SV\s+W\s+LD\s+OC)/i;
const RANGE_TOKEN = String.raw`(?:Melee|\d+["']|-)`;
const SKILL_TOKEN = String.raw`(?:\d+\+\^?|-|N\/A)`;
const PROFILE_TOKEN = String.raw`(?:\d*D\d+(?:[+-]\d+)?|-?\d+(?:[+-]\d+)?|N\/A|-)`;
const STAT_TAIL = new RegExp(`^(.*?)\\s+(${RANGE_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${SKILL_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${PROFILE_TOKEN})$`, "i");
const STAT_ONLY = new RegExp(`^(${RANGE_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${SKILL_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${PROFILE_TOKEN})$`, "i");

export const parseWeapons = (unitBlock, unitId) => {
  const lines = unitBlock.split("\n").map((line) => line.trim()).filter(Boolean);
  const weapons = [];
  let mode = null;
  let skillLabel = "N/A";
  let pendingName = null;
  let pendingRules = [];
  let pendingRaw = [];
  let ruleBuffer = null;
  let attachRulesToLast = false;

  const flush = (statLine = "") => {
    const tailMatch = statLine.match(STAT_TAIL);
    const onlyMatch = statLine.match(STAT_ONLY);
    const match = tailMatch || (onlyMatch && pendingName ? ["", pendingName, ...onlyMatch.slice(1)] : null);
    if (!match) return false;
    const inlineRuleMatch = match[1].match(/\[(.*?)\]/);
    if (inlineRuleMatch) {
      pendingRules.push(...collectRules(inlineRuleMatch[0]));
      match[1] = match[1].replace(/\[.*?\]/g, "").trim();
    }
    const nameFromStat = displayName(match[1]);
    const parsedName = nameFromStat || pendingName;
    if (!parsedName || !mode) return false;
    const countMatch = parsedName.match(/^(\d+)\s+(.+)$/);
    const countFromTable = countMatch ? Number(countMatch[1]) : null;
    const name = countMatch ? displayName(countMatch[2]) : parsedName;
    const rawLines = [...pendingRaw, statLine];
    weapons.push({
      id: createId("weapon", `${unitId}-${name}-${weapons.length}`, weapons.length),
      unitId,
      name,
      baseName: baseWeaponName(name),
      mode,
      countFromTable,
      range: match[2].replace("'", '"'),
      attacks: match[3],
      skillLabel,
      skill: match[4],
      strength: match[5],
      ap: match[6],
      damage: match[7],
      rules: pendingRules,
      rawLines
    });
    pendingName = null;
    pendingRules = [];
    pendingRaw = [];
    return true;
  };

  for (const line of lines) {
    const section = line.match(SECTION_START);
    if (section) {
      mode = /^Ranged/i.test(section[1]) ? "ranged" : "melee";
      skillLabel = section[2].toUpperCase();
      pendingName = null;
      pendingRules = [];
      pendingRaw = [];
      ruleBuffer = null;
      attachRulesToLast = false;
      continue;
    }

    if (!mode) continue;
    if (ANY_SECTION.test(line) && !SECTION_START.test(line)) {
      mode = null;
      ruleBuffer = null;
      continue;
    }

    if (ruleBuffer !== null) {
      ruleBuffer = `${ruleBuffer} ${line}`;
      if (!attachRulesToLast) pendingRaw.push(line);
      if (line.includes("]")) {
        const rules = collectRules(ruleBuffer);
        if (attachRulesToLast && weapons.length > 0) {
          weapons[weapons.length - 1].rules.push(...rules);
        } else {
          pendingRules.push(...rules);
        }
        ruleBuffer = null;
        attachRulesToLast = false;
      }
      continue;
    }

    if (/^[^a-zA-Z0-9]*\[/.test(line)) {
      const shouldAttachToLast = pendingName === null && weapons.length > 0;
      if (!shouldAttachToLast) pendingRaw.push(line);
      if (line.includes("]")) {
        const rules = collectRules(line);
        if (shouldAttachToLast) {
          weapons[weapons.length - 1].rules.push(...rules);
        } else {
          pendingRules.push(...rules);
        }
      } else {
        ruleBuffer = line;
        attachRulesToLast = shouldAttachToLast;
      }
      continue;
    }

    if (STAT_TAIL.test(line) || STAT_ONLY.test(line)) {
      flush(line);
      continue;
    }

    pendingName = displayName(line);
    pendingRaw = [line];
    pendingRules = [];
  }

  return weapons;
};

const collectRules = (line) => line
  .replace(/^.*?\[/, "")
  .replace(/\].*$/, "")
  .split(",")
  .map((rule) => displayName(rule))
  .filter(Boolean);
