import { createWarning, includesName, normalizeName, splitList, unique, WARNING_CODES } from "./normalize.js";

const ABILITY_START = /^Abilities Description$/i;
const END_START = /^(Faction:|Keywords:)/i;
const CORE_PREFIX = /^Core Abilities\s*(.*)$/i;
const INVULN_PREFIX = /^Invulnerable Save\s*(.*)$/i;
const ABILITY_DESCRIPTION_START = "(This unit|Each time|While|If|You can|The bearer|This model|At the end|Once per battle|Place)";

export const parseAbilities = (unitBlock) => {
  const lines = unitBlock.split("\n").map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => ABILITY_START.test(line));
  if (start < 0) return [];

  const abilities = [];
  for (const line of collectAbilityEntries(lines.slice(start + 1))) {
    if (END_START.test(line)) break;
    const core = line.match(CORE_PREFIX);
    if (core) {
      abilities.push(makeAbility("Core Abilities", core[1].trim(), "core", "unit", line));
      continue;
    }
    const invulnerable = line.match(INVULN_PREFIX);
    if (invulnerable) {
      abilities.push(makeAbility("Invulnerable Save", invulnerable[1], "unit", "all_models", line));
      continue;
    }
    const parsed = parseNamedAbility(line);
    if (parsed) abilities.push(parsed);
  }
  return abilities;
};

export const assignAbilitiesToModels = (unit) => {
  const warnings = [];
  const invulnerable = unit.unitRules.find((ability) => ability.name === "Invulnerable Save");
  if (invulnerable) {
    const save = invulnerable.description.match(/(\d\+\+?|\d\+)\s+invulnerable/i)?.[1] || null;
    unit.modelGroups.forEach((group) => {
      if (group.statProfile) group.statProfile.invulnerableSave = save;
    });
  }

  unit.unitRules.forEach((ability) => {
    const abilityNorm = normalizeName(ability.name);
    let assigned = false;

    unit.modelGroups.forEach((group) => {
      const equipmentHit = group.equipmentItems.some((item) => normalizeName(item.name) === abilityNorm || includesName(item.name, ability.name));
      const modelHit = includesName(group.modelName, ability.name) || ability.targetModelNames.some((target) => includesName(group.modelName, target));
      const unitWide = ability.appliesTo === "unit" || ability.appliesTo === "all_models" || ability.source === "core";
      const singleModelFallback = unit.modelGroups.length === 1 && (ability.appliesTo === "specific_model" || ability.appliesTo === "unknown");
      const bearer = ability.appliesTo === "bearer" && (equipmentHit || unit.modelGroups.length === 1);

      if (unitWide || equipmentHit || modelHit || bearer || singleModelFallback) {
        group.matchedAbilities.push(ability);
        assigned = true;
      }
    });

    if (!assigned && !/^\s*$/.test(ability.name)) {
      warnings.push(createWarning(WARNING_CODES.ABILITY_SCOPE_UNKNOWN, `Ability "${ability.name}" could not be scoped to a model group.`, {
        unitName: unit.name,
        rawText: ability.rawText
      }));
    }
  });

  unit.parseWarnings.push(...warnings);
  return unit;
};

const makeAbility = (name, description, source, appliesTo, rawText) => ({
  name: name.trim(),
  description: description.trim(),
  source,
  appliesTo,
  targetModelNames: [],
  relatedEquipmentNames: [],
  rawText
});

const collectAbilityEntries = (lines) => {
  const entries = [];
  lines.some((line) => {
    if (END_START.test(line)) return true;
    if (entries.length && isDescriptionOnlyLine(line) && isBareAbilityName(entries[entries.length - 1])) {
      entries[entries.length - 1] = `${entries[entries.length - 1]} ${line}`;
      return false;
    }
    if (entries.length && isAbilityContinuation(line)) {
      entries[entries.length - 1] = `${entries[entries.length - 1]} ${line}`;
      return false;
    }
    if (isAbilityEntryStart(line) || !entries.length) {
      entries.push(line);
      return false;
    }
    entries[entries.length - 1] = `${entries[entries.length - 1]} ${line}`;
    return false;
  });
  return entries;
};

const isAbilityContinuation = (line) => /^[a-z]/.test(line.trim());

const isBareAbilityName = (line) => /^[A-Z][A-Za-z0-9' -]{2,47}$/.test(line.trim());

const isDescriptionOnlyLine = (line) => new RegExp(`^${ABILITY_DESCRIPTION_START}\\b.+$`, "i").test(line.trim());

const isAbilityEntryStart = (line) => {
  if (CORE_PREFIX.test(line) || INVULN_PREFIX.test(line)) return true;
  if (line.match(/^([A-Z][A-Za-z0-9' -]{2,}?)(?:\s{2,}|\.\s+|\s+-\s+).+$/)) return true;
  const firstSentence = line.match(new RegExp(`^([A-Z][^,:;\\n]{2,47}?)\\s+${ABILITY_DESCRIPTION_START}\\b.+$`, "i"));
  return Boolean(firstSentence && !/[,:;]/.test(firstSentence[1]));
};

const parseNamedAbility = (line) => {
  const trimmed = line.trim();
  if (isUnnamedUnitAbility(trimmed)) {
    return makeAbility("Unit Ability", trimmed, "unit", "unit", trimmed);
  }

  const match = line.match(/^([A-Z][A-Za-z0-9' -]{2,}?)(?:\s{2,}|\.\s+|\s+-\s+)(.+)$/);
  if (match) {
    return makeAbility(match[1], match[2], inferSource(match[1], match[2]), inferScope(match[2]), line);
  }
  const firstSentence = line.match(new RegExp(`^([A-Z][^,:;]{2,47}?)\\s+${ABILITY_DESCRIPTION_START}\\b(.+)$`, "i"));
  if (!firstSentence) {
    if (/^[a-z]/.test(trimmed)) return makeAbility("Unit Ability", trimmed, "unit", "unit", trimmed);
    return makeAbility(line, "", "unknown", "unknown", line);
  }
  return makeAbility(firstSentence[1], `${firstSentence[2]}${firstSentence[3]}`, inferSource(firstSentence[1], line), inferScope(line), line);
};

const inferScope = (text) => {
  if (/this unit|models in that unit|units? with this ability|your army includes one or more units?|hit roll|wound roll|attack targets|enemy unit/i.test(text)) return "unit";
  if (/objective marker|miracle dice|tokens? next to the unit/i.test(text)) return "unit";
  if (/stratagem|-\d+ cp\b/i.test(text)) return "unit";
  if (/all models/i.test(text)) return "all_models";
  if (/bearer/i.test(text)) return "bearer";
  if (/this model/i.test(text)) return "specific_model";
  return "unknown";
};

const inferSource = (name, text) => {
  if (/enhancement/i.test(text)) return "enhancement";
  if (/core abilities/i.test(name)) return "core";
  if (/faction/i.test(text)) return "faction";
  return "unit";
};

const isUnnamedUnitAbility = (line) => {
  if (!line || /^[A-Z]/.test(line)) return false;
  return /\b(re-?roll|hit roll|wound roll|attack|attacks|target|targets|enemy unit)\b/i.test(line);
};

export const formatAbilities = (abilities) => unique(abilities.map((ability) => ability.description ? `${ability.name}: ${ability.description}` : ability.name));
