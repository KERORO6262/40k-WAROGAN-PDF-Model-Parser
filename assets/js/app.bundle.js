/* Generated browser bundle for direct file:/// use. Keep source modules as the editable source of truth. */
(() => {
  "use strict";

  // assets/js/parser/normalize.js
  const WARNING_CODES = {
    STAT_PROFILE_UNMATCHED: "STAT_PROFILE_UNMATCHED",
    EQUIPMENT_UNMATCHED: "EQUIPMENT_UNMATCHED",
    WEAPON_UNASSIGNED: "WEAPON_UNASSIGNED",
    ABILITY_SCOPE_UNKNOWN: "ABILITY_SCOPE_UNKNOWN",
    KEYWORD_SCOPE_UNKNOWN: "KEYWORD_SCOPE_UNKNOWN",
    PDF_TEXT_EXTRACTION_LOW_CONFIDENCE: "PDF_TEXT_EXTRACTION_LOW_CONFIDENCE",
    UNIT_BLOCK_NO_STATS: "UNIT_BLOCK_NO_STATS"
  };

  const JOINED_HEADERS = [
    ["RangedWeapons", "Ranged Weapons"],
    ["MeleeWeapons", "Melee Weapons"],
    ["CoreAbilities", "Core Abilities"],
    ["AbilitiesDescription", "Abilities Description"],
    ["InvulnerableSave", "Invulnerable Save"],
    ["FeelNoPain", "Feel No Pain"],
    ["UnitMTSVWLDOC", "Unit M T SV W LD OC"]
  ];

  const normalizeText = (rawText = "") => {
    let text = rawText
      .replace(/\r\n?/g, "\n")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/6""/g, '6"')
      .replace(/\u00a0/g, " ");

    JOINED_HEADERS.forEach(([from, to]) => {
      text = text.replaceAll(from, to);
    });

    return text
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const normalizeName = (name = "") => name
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[.,:;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\bdeath cult\b/g, "death cult")
    .replace(/['"]/g, "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\bmodels\b/g, "model")
    .replace(/\bweapons\b/g, "weapon")
    .replace(/\bblades\b/g, "blade")
    .replace(/\bpistols\b/g, "pistol")
    .replace(/\s+/g, " ")
    .replace(/s\b/g, "")
    .trim();

  const displayName = (name = "") => name.replace(/\s+/g, " ").trim();

  const normalizeModelScope = (name = "") => displayName(name)
    .replace(/^[??•*-]\s*/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[.,:;|]+$/g, "")
    .trim();

  const baseWeaponName = (name = "") => displayName(name)
    .replace(/\s+-\s+(standard|supercharge|strike|sweep|prioris|sanctorum|focused|dispersed|single|sustained).*$/i, "")
    .trim();

  const createId = (prefix, text, index = 0) => {
    const slug = normalizeName(text).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `${prefix}-${slug || "item"}-${index + 1}`;
  };

  const createWarning = (code, message, context = {}) => ({
    level: context.level || "warning",
    code,
    message,
    unitName: context.unitName,
    modelName: context.modelName,
    rawText: context.rawText
  });

  const splitList = (value = "") => value
    .replace(/\s+and\s+/gi, ", ")
    .split(",")
    .map((item) => item.trim().replace(/[.;]+$/g, ""))
    .filter(Boolean);

  const parseQuantityName = (value = "") => {
    const match = value.trim().match(/^(\d+)\s+(.+)$/);
    return match
      ? { quantity: Number(match[1]), name: displayName(match[2]) }
      : { quantity: 1, name: displayName(value) };
  };

  const includesName = (left, right) => {
    const a = normalizeName(left);
    const b = normalizeName(right);
    return Boolean(a && b && (a.includes(b) || b.includes(a)));
  };

  const matchConfidence = (left, right) => {
    const leftNorm = normalizeName(left);
    const rightNorm = normalizeName(right);
    if (left === right) return "exact";
    if (leftNorm === rightNorm) return "normalized";
    if (leftNorm && rightNorm && (leftNorm.includes(rightNorm) || rightNorm.includes(leftNorm))) return "fuzzy";
    return null;
  };

  const escapeHtml = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const unique = (values) => [...new Set(values.map((value) => displayName(value)).filter(Boolean))];


  // assets/js/parser/abilityParser.js
  const ABILITY_START = /^Abilities Description$/i;
  const END_START = /^(Faction:|Keywords:)/i;
  const CORE_PREFIX = /^Core Abilities\s*(.*)$/i;
  const INVULN_PREFIX = /^Invulnerable Save\s*(.*)$/i;
  const ABILITY_DESCRIPTION_START = "(This unit|Each time|While|If|You can|The bearer|This model|At the end|Once per battle|Place)";

  const parseAbilities = (unitBlock) => {
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

  const assignAbilitiesToModels = (unit) => {
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
    if (/objective marker|miracle dice|token next to the unit/i.test(text)) return "unit";
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

  const formatAbilities = (abilities) => unique(abilities.map((ability) => ability.description ? `${ability.name}: ${ability.description}` : ability.name));


  // assets/js/parser/keywordParser.js
  const parseKeywords = (unitBlock) => {
    const rawLine = unitBlock.split("\n").find((line) => /^Keywords:/i.test(line.trim())) || "";
    const rawText = rawLine.replace(/^Keywords:\s*/i, "").trim();
    const keywordSet = { allModels: [], unitOnly: [], byModelName: {}, rawText };
    if (!rawText) return keywordSet;

    rawText.split("|").map((part) => part.trim()).filter(Boolean).forEach((part) => {
      if (!/:/.test(part)) {
        keywordSet.allModels = unique([...keywordSet.allModels, ...splitKeywords(part)]);
        return;
      }

      const [scope, ...valueParts] = part.split(":").map((item) => item.trim());
      const values = valueParts.join(":").trim();
      if (/^All Models$/i.test(scope)) {
        keywordSet.allModels = unique([...keywordSet.allModels, ...splitKeywords(values)]);
        return;
      }
      if (/^Unit$/i.test(scope)) {
        keywordSet.unitOnly = unique([...keywordSet.unitOnly, ...splitKeywords(values)]);
        return;
      }
      const modelName = titleCase(normalizeModelScope(scope));
      if (!modelName) return;
      keywordSet.byModelName[modelName] = unique(splitKeywords(values));
    });

    return keywordSet;
  };

  const assignKeywordsToModels = (unit) => {
    unit.modelGroups.forEach((group) => {
      const specific = Object.entries(unit.unitKeywords.byModelName)
        .filter(([modelName]) => modelScopeCandidates(group).some((candidate) => includesName(candidate, modelName)))
        .flatMap(([, keywords]) => keywords);
      group.keywords = {
        ...unit.unitKeywords,
        allModels: unique([...unit.unitKeywords.allModels, ...specific]),
        byModelName: unit.unitKeywords.byModelName
      };
    });

    Object.keys(unit.unitKeywords.byModelName).forEach((modelName) => {
      const matched = unit.modelGroups.some((group) => modelScopeCandidates(group).some((candidate) => includesName(candidate, modelName)));
      if (!matched) {
        unit.parseWarnings.push(createWarning(WARNING_CODES.KEYWORD_SCOPE_UNKNOWN, `Keywords for "${modelName}" could not be assigned to a model group.`, {
          unitName: unit.name,
          rawText: unit.unitKeywords.rawText
        }));
      }
    });

    return unit;
  };

  const modelScopeCandidates = (group) => unique([
    group.modelName,
    normalizeModelScope(group.modelName),
    group.statProfile?.modelName,
    normalizeModelScope(group.statProfile?.modelName)
  ]);

  const splitKeywords = (value = "") => splitList(value)
    .map((keyword) => keyword.replace(/[.,:;|]+$/g, "").trim())
    .filter(Boolean);

  const titleCase = (value) => displayName(value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()));


  // assets/js/parser/weaponParser.js
  const SECTION_START = /^(Ranged Weapons|Melee Weapons)\s+Range\s+A\s+(BS|WS)\s+S\s+AP\s+D$/i;
  const ANY_SECTION = /^(Ranged Weapons|Melee Weapons|Abilities Description|Faction:|Keywords:|Unit\s+M\s+T\s+SV\s+W\s+LD\s+OC)/i;
  const RANGE_TOKEN = String.raw`(?:Melee|\d+["']|-)`;
  const SKILL_TOKEN = String.raw`(?:\d+\+\^?|-|N\/A)`;
  const PROFILE_TOKEN = String.raw`(?:\d*D\d+(?:[+-]\d+)?|-?\d+(?:[+-]\d+)?|N\/A|-)`;
  const STAT_TAIL = new RegExp(`^(.*?)\\s+(${RANGE_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${SKILL_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${PROFILE_TOKEN})$`, "i");
  const STAT_ONLY = new RegExp(`^(${RANGE_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${SKILL_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${PROFILE_TOKEN})\\s+(${PROFILE_TOKEN})$`, "i");

  const parseWeapons = (unitBlock, unitId) => {
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
        attachRulesToLast = false;
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

      if (line.startsWith("[")) {
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
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((rule) => displayName(rule))
    .filter(Boolean);


  // assets/js/parser/modelParser.js
  const STAT_LINE = /^(.+?)\s+(\d+["']\^?|-) ?\s+(\d+|-)\s+(\d\+\^?|-)\s+(\d+|-)\s+(\d\+\^?|-)\s+(\d+\^?|-)\s*$/i;

  const parseModelLoadouts = (unitBlock, unitId) => {
    const beforeStats = unitBlock.split(/\nUnit\s+M\s+T\s+SV\s+W\s+LD\s+OC\b/i)[0] || unitBlock;
    const lines = normalizeLoadoutLines(beforeStats);

    return lines
      .map((line) => line.replace(/^[??-]\s*/, "").trim())
      .filter((line) => /\bequipped with:\s*/i.test(line))
      .map((line, index) => {
        const [left, equipmentRaw = ""] = line.split(/\bequipped with:\s*/i);
        const parsedModel = parseQuantityName(left);
        const equipmentItems = splitList(equipmentRaw).map((sourceText) => {
          const parsedEquipment = parseQuantityName(sourceText);
          return {
            name: parsedEquipment.name,
            normalizedName: normalizeName(parsedEquipment.name),
            quantityPerModel: parsedEquipment.quantity,
            sourceText,
            matchedWeaponIds: [],
            isWeapon: false,
            isWargearAbility: false,
            matchConfidence: "unmatched"
          };
        });

        return {
          id: createId("model", `${unitId}-${parsedModel.name}-${index}`, index),
          unitId,
          modelName: displayName(parsedModel.name),
          count: parsedModel.quantity,
          equipmentRaw: displayName(equipmentRaw),
          equipmentItems,
          statProfile: null,
          matchedWeapons: [],
          matchedAbilities: [],
          keywords: { allModels: [], unitOnly: [], byModelName: {}, rawText: "" },
          notes: []
        };
      });
  };

  const normalizeLoadoutLines = (text) => {
    const lines = text.split("\n")
      .map((line) => line.trim().replace(/^[????-]\s*/, "").trim())
      .filter(Boolean);
    const normalizedLines = [];
    let pendingModelName = "";

    lines.forEach((line) => {
      if (!/\bequipped with:\s*/i.test(line)) {
        pendingModelName = line;
        return;
      }

      if (pendingModelName && /^equipped with:\s*/i.test(line)) {
        normalizedLines.push(`${pendingModelName} ${line}`);
        pendingModelName = "";
        return;
      }

      normalizedLines.push(line);
      pendingModelName = "";
    });

    return normalizedLines;
  };

  const parseModelStatProfiles = (unitBlock) => {
    const statsIndex = unitBlock.search(/\nUnit\s+M\s+T\s+SV\s+W\s+LD\s+OC\b/i);
    if (statsIndex < 0) return [];

    const afterHeader = unitBlock.slice(statsIndex).split("\n").slice(1);
    const profiles = [];
    for (const rawLine of afterHeader) {
      const line = rawLine.trim();
      if (!line) continue;
      if (/^(Ranged Weapons|Melee Weapons|Abilities Description|Faction:|Keywords:)/i.test(line)) break;
      const match = line.match(STAT_LINE);
      if (!match) continue;
      profiles.push({
        modelName: displayName(match[1]),
        movement: match[2].replace("'", '"'),
        toughness: match[3],
        save: match[4],
        wounds: match[5],
        leadership: match[6],
        objectiveControl: match[7],
        invulnerableSave: null,
        rawLine: line
      });
    }
    return profiles;
  };

  const matchStatProfile = (modelGroup, statProfiles) => {
    if (!statProfiles.length) return null;
    if (statProfiles.length === 1) return statProfiles[0];

    const exact = statProfiles.find((profile) => profile.modelName === modelGroup.modelName);
    if (exact) return exact;

    const normalized = statProfiles.find((profile) => normalizeName(profile.modelName) === normalizeName(modelGroup.modelName));
    if (normalized) return normalized;

    const contained = statProfiles.find((profile) => includesName(profile.modelName, modelGroup.modelName) && !/^other models$/i.test(profile.modelName));
    if (contained) return contained;

    return statProfiles.find((profile) => /^other models$/i.test(profile.modelName)) || null;
  };

  const attachStatProfiles = (unit) => {
    unit.modelGroups.forEach((group) => {
      group.statProfile = matchStatProfile(group, unit.modelStatProfiles);
      if (!group.statProfile) {
        unit.parseWarnings.push(createWarning(WARNING_CODES.STAT_PROFILE_UNMATCHED, `No stat profile matched "${group.modelName}".`, {
          unitName: unit.name,
          modelName: group.modelName,
          rawText: group.equipmentRaw
        }));
      }
    });
    return unit;
  };

  const findEquipmentMatch = (equipmentName, weaponProfiles) => {
    const candidates = weaponProfiles
      .map((weapon) => ({
        weapon,
        confidence: matchConfidence(equipmentName, weapon.name) || matchConfidence(equipmentName, weapon.baseName)
      }))
      .filter((candidate) => candidate.confidence);

    const rank = { exact: 0, normalized: 1, fuzzy: 2 };
    return candidates.sort((a, b) => rank[a.confidence] - rank[b.confidence]);
  };

  const matchEquipmentToWeapons = (unit) => {
    const assignedWeaponIds = new Set();
    const abilityNames = new Set(unit.unitRules.map((ability) => normalizeName(ability.name)));
    const shouldWarnUnmatchedEquipment = (group, item) => {
      if (abilityNames.has(item.normalizedName)) return false;
      if (unit.modelGroups.length === 1) return false;
      if (!isWeaponLikeEquipment(item.name)) return false;
      return !group.matchedAbilities.some((ability) => normalizeName(ability.name) === item.normalizedName);
    };

    unit.modelGroups.forEach((group) => {
      group.equipmentItems.forEach((item) => {
        const matches = findEquipmentMatch(item.name, unit.weapons);
        if (!matches.length) {
          item.isWargearAbility = true;
          item.matchConfidence = abilityNames.has(item.normalizedName) ? "ability" : "unmatched";
          if (!shouldWarnUnmatchedEquipment(group, item)) return;
          unit.parseWarnings.push(createWarning(WARNING_CODES.EQUIPMENT_UNMATCHED, `Equipment "${item.name}" has no matching weapon profile. Treat as wargear ability.`, {
            unitName: unit.name,
            modelName: group.modelName,
            rawText: item.sourceText
          }));
          return;
        }

        matches.forEach(({ weapon, confidence }) => {
          assignedWeaponIds.add(weapon.id);
          item.isWeapon = true;
          item.matchConfidence = item.matchConfidence === "exact" ? "exact" : confidence;
          item.matchedWeaponIds.push(weapon.id);
          const quantityTotal = Math.max(1, item.quantityPerModel * group.count);
          group.matchedWeapons.push({
            equipmentName: item.name,
            weaponProfileId: weapon.id,
            weaponName: weapon.name,
            quantityTotal,
            quantityPerModel: item.quantityPerModel,
            matchConfidence: confidence
          });
        });
      });
    });

    assignRemainingWeaponsToSingleModel(unit, assignedWeaponIds);
    assignRemainingWeaponsToMatchingEquipment(unit, assignedWeaponIds);
    assignLeaderMeleeWeaponsToInferredEquipment(unit, assignedWeaponIds);

    unit.weapons.forEach((weapon) => {
      if (!assignedWeaponIds.has(weapon.id)) {
        unit.parseWarnings.push(createWarning(WARNING_CODES.WEAPON_UNASSIGNED, `Weapon profile "${weapon.name}" was not assigned to equipment.`, {
          unitName: unit.name,
          rawText: weapon.rawLines.join("\n")
        }));
      }
    });

    return unit;
  };

  const isWeaponLikeEquipment = (name) => /\b(autogun|autopistol|blade|bolter|cannon|carbine|chainsword|claw|combat weapon|flamer|grenade|gun|knife|lance|las|melta|missile|pistol|plasma|power weapon|rifle|spear|staff|sword|weapon)\b/i.test(name);

  const isLeaderModel = (group) => /\b(superior|sergeant|leader|champion|captain|warlord)\b/i.test(group.modelName);

  const isCommonLeaderMeleeWeapon = (weapon) => weapon.mode === "melee" && /\b(power weapon|power sword|chainsword|blade|sword|maul|mace|axe|staff|spear)\b/i.test(weapon.name);

  const assignRemainingWeaponsToMatchingEquipment = (unit, assignedWeaponIds) => {
    unit.weapons
      .filter((weapon) => !assignedWeaponIds.has(weapon.id))
      .forEach((weapon) => {
        const candidates = unit.modelGroups.flatMap((group) => group.equipmentItems
          .filter((item) => matchConfidence(item.name, weapon.name) || matchConfidence(item.name, weapon.baseName))
          .map((item) => ({ group, item })));

        if (candidates.length !== 1) return;

        const [{ group, item }] = candidates;
        assignedWeaponIds.add(weapon.id);
        item.isWeapon = true;
        item.matchConfidence = item.matchConfidence === "exact" ? "exact" : "fallback";
        item.matchedWeaponIds.push(weapon.id);
        group.matchedWeapons.push({
          equipmentName: item.name,
          weaponProfileId: weapon.id,
          weaponName: weapon.name,
          quantityTotal: Math.max(1, item.quantityPerModel * group.count),
          quantityPerModel: item.quantityPerModel,
          matchConfidence: "fallback"
        });
      });
  };

  const assignLeaderMeleeWeaponsToInferredEquipment = (unit, assignedWeaponIds) => {
    const leaderGroups = unit.modelGroups.filter((group) => group.count === 1 && isLeaderModel(group));
    if (leaderGroups.length !== 1) return;
    const [group] = leaderGroups;

    unit.weapons
      .filter((weapon) => !assignedWeaponIds.has(weapon.id) && isCommonLeaderMeleeWeapon(weapon))
      .forEach((weapon) => {
        assignedWeaponIds.add(weapon.id);
        const quantityPerModel = Math.max(1, weapon.countFromTable || 1);
        const inferredItem = {
          name: weapon.name,
          normalizedName: normalizeName(weapon.name),
          quantityPerModel,
          sourceText: weapon.rawLines.join("\n"),
          matchedWeaponIds: [weapon.id],
          isWeapon: true,
          isWargearAbility: false,
          matchConfidence: "inferred"
        };
        group.equipmentItems.push(inferredItem);
        group.matchedWeapons.push({
          equipmentName: weapon.name,
          weaponProfileId: weapon.id,
          weaponName: weapon.name,
          quantityTotal: quantityPerModel,
          quantityPerModel,
          matchConfidence: "inferred"
        });
      });
  };

  const assignRemainingWeaponsToSingleModel = (unit, assignedWeaponIds) => {
    if (unit.modelGroups.length !== 1) return;
    const [group] = unit.modelGroups;
    unit.weapons
      .filter((weapon) => !assignedWeaponIds.has(weapon.id))
      .forEach((weapon) => {
        assignedWeaponIds.add(weapon.id);
        group.matchedWeapons.push({
          equipmentName: weapon.name,
          weaponProfileId: weapon.id,
          weaponName: weapon.name,
          quantityTotal: Math.max(1, weapon.countFromTable || group.count),
          quantityPerModel: Math.max(1, weapon.countFromTable || 1),
          matchConfidence: "single-model-fallback"
        });
      });
  };


  // assets/js/parser/unitParser.js
  const UNIT_TITLE = /^(.+?)\s*\[(\d+)\s*pts\]\s*$/i;
  const BAD_TITLES = /^(Enhancement|Enhancements|Stratagems|Core Stratagems|Army Roster|Roster|Detachment)/i;

  const parseArmy = (rawText, sourceFileName = "WAROGAN.pdf") => {
    const fullText = normalizeText(rawText);
    const warnings = [];

    if (fullText.length < 250) {
      warnings.push(createWarning(WARNING_CODES.PDF_TEXT_EXTRACTION_LOW_CONFIDENCE, "Extracted PDF text is very short. The source may be scanned or image-only.", {
        level: "warning",
        rawText: fullText
      }));
    }

    const unitBlocks = splitUnitBlocks(fullText);
    const units = unitBlocks.map((block, index) => parseUnitBlock(block, index));
    const army = {
      title: extractArmyTitle(fullText),
      battleSize: extractMeta(fullText, /Battle Size:\s*(.+)/i),
      faction: extractMeta(fullText, /Faction:\s*(.+)/i),
      detachment: extractMeta(fullText, /Detachment:\s*(.+)/i),
      sourceFileName,
      fullText,
      units,
      parseWarnings: warnings
    };

    army.parseWarnings.push(...units.flatMap((unit) => unit.parseWarnings));
    return army;
  };

  const splitUnitBlocks = (fullText) => {
    const lines = fullText.split("\n");
    const starts = [];

    lines.forEach((line, index) => {
      const match = line.trim().match(UNIT_TITLE);
      if (!match || BAD_TITLES.test(match[1])) return;
      starts.push(index);
    });

    return starts
      .map((start, index) => lines.slice(start, starts[index + 1] ?? lines.length).join("\n").trim())
      .filter((block) => /\nUnit\s+M\s+T\s+SV\s+W\s+LD\s+OC\b/i.test(block))
      .filter(Boolean);
  };

  const parseUnitBlock = (rawBlock, index = 0) => {
    const header = rawBlock.split("\n").find((line) => UNIT_TITLE.test(line.trim())) || "";
    const [, name = "Unknown Unit", pointsText = ""] = header.trim().match(UNIT_TITLE) || [];
    const id = createId("unit", name, index);
    const unit = {
      id,
      name: name.trim(),
      displayName: name.trim(),
      points: pointsText ? Number(pointsText) : null,
      rawBlock,
      faction: extractMeta(rawBlock, /Faction:\s*(.+)/i),
      unitRules: parseAbilities(rawBlock),
      unitKeywords: parseKeywords(rawBlock),
      modelStatProfiles: parseModelStatProfiles(rawBlock),
      weapons: parseWeapons(rawBlock, id),
      modelGroups: parseModelLoadouts(rawBlock, id),
      enhancements: [],
      parseWarnings: []
    };

    if (!unit.modelStatProfiles.length) {
      unit.parseWarnings.push(createWarning(WARNING_CODES.UNIT_BLOCK_NO_STATS, `Unit "${unit.name}" has no Unit stat table.`, {
        unitName: unit.name,
        rawText: rawBlock
      }));
    }

    if (!unit.modelGroups.length) {
      unit.modelGroups = [{
        id: createId("model", unit.name, 0),
        unitId: id,
        modelName: unit.name,
        count: 1,
        equipmentRaw: "",
        equipmentItems: [],
        statProfile: null,
        matchedWeapons: [],
        matchedAbilities: [],
        keywords: { allModels: [], unitOnly: [], byModelName: {}, rawText: "" },
        notes: ["No equipped with line found."]
      }];
    }

    attachStatProfiles(unit);
    matchEquipmentToWeapons(unit);
    assignAbilitiesToModels(unit);
    assignKeywordsToModels(unit);
    return unit;
  };

  const extractArmyTitle = (text) => {
    const firstMeaningful = text.split("\n").find((line) => line.trim() && !/^--- PAGE/i.test(line));
    return firstMeaningful?.trim() || "Warhammer 40,000 10th Edition";
  };

  const extractMeta = (text, pattern) => text.match(pattern)?.[1]?.trim() || null;

  // assets/js/parser/editions/edition11.js
  const EDITION_11_TITLE_FALLBACK = "Warhammer 40,000 11th Edition";
  const EDITION_10_TITLE = "Warhammer 40,000 10th Edition";
  const TABLE_HEADERS = [
    "Unit M T SV W LD OC",
    "Ranged Weapons Range A BS S AP D",
    "Melee Weapons Range A WS S AP D",
    "Abilities Description"
  ];

  const parse11 = (rawText, sourceFileName = "WAROGAN.pdf") => {
    const army = parseArmy(normalizeEdition11Text(rawText), sourceFileName);
    if (!army.title || army.title === EDITION_10_TITLE) {
      army.title = EDITION_11_TITLE_FALLBACK;
    }
    return army;
  };

  const normalizeEdition11Text = (rawText = "") => {
    let text = String(rawText)
      .replace(/\r\n?/g, "\n")
      .replace(/([^\n])\s+(Unit\s+M\s+T\s+SV\s+W\s+LD\s+OC\b)/gi, "$1\n$2")
      .replace(/([^\n])\s+(Ranged\s+Weapons\s+Range\s+A\s+BS\s+S\s+AP\s+D\b)/gi, "$1\n$2")
      .replace(/([^\n])\s+(Melee\s+Weapons\s+Range\s+A\s+WS\s+S\s+AP\s+D\b)/gi, "$1\n$2")
      .replace(/([^\n])\s+(Abilities\s+Description\b)/gi, "$1\n$2")
      .replace(/([^\n])\s+(Keywords:)/gi, "$1\n$2")
      .replace(/([^\n])\s+(Faction:)/gi, "$1\n$2");

    TABLE_HEADERS.forEach((header) => {
      const compactHeader = header.replace(/\s+/g, "\\s+");
      text = text.replace(new RegExp(`(^|\\n)\\s*${compactHeader}\\s*`, "gi"), `\n${header}\n`);
    });

    return text
      .split("\n")
      .map(cleanEdition11Line)
      .filter((line, index, lines) => !isRepeatedUnitNameBeforeTitle(line, lines[index + 1]))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const cleanEdition11Line = (line = "") => line
    .replace(/^[^A-Za-z0-9(]+(?=\d*\s*[A-Za-z(])/g, "")
    .replace(/^\s*["']+\s*(?=\d*\s*[A-Za-z(])/u, "")
    .replace(/\s+/g, " ")
    .trim();

  const isRepeatedUnitNameBeforeTitle = (line = "", nextLine = "") => {
    const title = nextLine.match(/^(.+?)\s*\[\d+\s*pts\]\s*$/i);
    return Boolean(title && line.toLowerCase() === title[1].trim().toLowerCase());
  };

  // assets/js/parser/editions/parserRegistry.js
  const getParser = (edition) => edition === "11" ? parse11 : parseArmy;

  // assets/js/parser/exportBuilder.js
  const buildExportArmy = (army) => ({
    title: army.title,
    battleSize: army.battleSize,
    faction: army.faction,
    detachment: army.detachment,
    units: army.units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      displayName: unit.displayName,
      points: unit.points,
      faction: unit.faction,
      unitRules: unit.unitRules,
      unitKeywords: unit.unitKeywords,
      modelStatProfiles: unit.modelStatProfiles,
      weapons: unit.weapons,
      modelGroups: unit.modelGroups.map((group) => ({
        id: group.id,
        unitId: group.unitId,
        modelName: group.modelName,
        count: group.count,
        stats: formatStats(group.statProfile),
        equipment: group.equipmentItems.map((item) => ({
          name: item.name,
          normalizedName: item.normalizedName,
          quantityPerModel: item.quantityPerModel,
          sourceText: item.sourceText,
          isWeapon: item.isWeapon,
          isWargearAbility: item.isWargearAbility,
          matchConfidence: item.matchConfidence,
          weaponProfiles: item.matchedWeaponIds.map((id) => formatWeapon(unit.weapons.find((weapon) => weapon.id === id))).filter(Boolean)
        })),
        abilities: group.matchedAbilities,
        keywords: group.keywords.allModels,
        notes: group.notes
      })),
      enhancements: unit.enhancements,
      parseWarnings: unit.parseWarnings
    })),
    parseWarnings: army.parseWarnings
  });

  const buildCsv = (army, rows) => {
    const header = ["Unit", "Points", "Model", "Count", "M", "T", "SV", "INV", "W", "LD", "OC", "Equipment", "Weapon", "Type", "Range", "A", "BS_WS", "S", "AP", "D", "Rules", "Abilities", "Keywords", "Warnings"];
    const dataRows = rows.flatMap(({ unit, group }) => {
      const stats = group.statProfile || {};
      const warnings = getGroupWarnings(unit, group).map((warning) => warning.code).join("; ");
      const abilities = formatAbilities(group.matchedAbilities).join("; ");
      const keywords = group.keywords.allModels.join("; ");
      const equipmentRows = group.equipmentItems.length ? group.equipmentItems : [{ name: "", matchedWeaponIds: [] }];

      return equipmentRows.flatMap((item) => {
        const weaponIds = item.matchedWeaponIds?.length ? item.matchedWeaponIds : [null];
        return weaponIds.map((weaponId) => {
          const weapon = unit.weapons.find((profile) => profile.id === weaponId);
          return [
            unit.name,
            unit.points ?? "",
            group.modelName,
            group.count,
            stats.movement || "",
            stats.toughness || "",
            stats.save || "",
            stats.invulnerableSave || "",
            stats.wounds || "",
            stats.leadership || "",
            stats.objectiveControl || "",
            item.name || "",
            weapon?.name || "",
            weapon?.mode || "",
            weapon?.range || "",
            weapon?.attacks || "",
            weapon?.skill || "",
            weapon?.strength || "",
            weapon?.ap || "",
            weapon?.damage || "",
            weapon?.rules.join("; ") || "",
            abilities,
            keywords,
            warnings
          ];
        });
      });
    });

    return [header, ...dataRows].map((row) => row.map(csvCell).join(",")).join("\n");
  };

  const buildHtmlTable = (rows) => `<!doctype html>
  <html lang="zh-Hant">
  <head><meta charset="utf-8"><title>WAROGAN Model Export</title>
  <style>body{font-family:Arial,sans-serif;margin:20px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ccc;padding:6px;vertical-align:top}th{background:#f4f4f4}</style></head>
  <body><table><thead><tr><th>Unit</th><th>Model</th><th>Count</th><th>Stats</th><th>Equipment</th><th>Weapon Profiles</th><th>Abilities</th><th>Keywords</th><th>Warnings</th></tr></thead><tbody>
  ${rows.map(({ unit, group }) => `<tr><td>${escapeHtml(unit.name)}</td><td>${escapeHtml(group.modelName)}</td><td>${group.count}</td><td>${escapeHtml(renderStats(group.statProfile))}</td><td>${escapeHtml(group.equipmentItems.map((item) => item.name).join(", "))}</td><td>${escapeHtml(renderWeapons(unit, group))}</td><td>${escapeHtml(formatAbilities(group.matchedAbilities).join("; "))}</td><td>${escapeHtml(group.keywords.allModels.join(", "))}</td><td>${escapeHtml(getGroupWarnings(unit, group).map((warning) => warning.code).join("; "))}</td></tr>`).join("")}
  </tbody></table></body></html>`;

  const flattenRows = (army, expanded = false) => army.units.flatMap((unit) => unit.modelGroups.flatMap((group) => {
    if (!expanded || group.count <= 1) {
      return [{ unit, group: withRowIdentity(group, "group") }];
    }
    return Array.from({ length: group.count }, (_, index) => ({
      unit,
      group: withRowIdentity({
        ...group,
        modelName: singularModelName(group.modelName, index + 1),
        count: 1
      }, "individual", index)
    }));
  }));

  const getGroupWarnings = (unit, group) => {
    const modelName = group.originalModelName || group.modelName;
    return unit.parseWarnings.filter((warning) => !warning.modelName || warning.modelName === modelName);
  };

  const renderStats = (profile) => profile
    ? `M ${profile.movement} / T ${profile.toughness} / SV ${profile.save} / INV ${profile.invulnerableSave || "-"} / W ${profile.wounds} / LD ${profile.leadership} / OC ${profile.objectiveControl}`
    : "-";

  const renderWeapons = (unit, group) => unique(group.matchedWeapons.map((match) => {
    const weapon = unit.weapons.find((profile) => profile.id === match.weaponProfileId);
    if (!weapon) return "";
    return `${weapon.name} (${weapon.mode}; ${weapon.range}, A ${weapon.attacks}, ${weapon.skillLabel} ${weapon.skill}, S ${weapon.strength}, AP ${weapon.ap}, D ${weapon.damage}${weapon.rules.length ? `; ${weapon.rules.join(", ")}` : ""})`;
  })).join("\n");

  const buildTaggedPreview = (army, unit, group) => {
    const t = (key) => window.i18n?.t(key) ?? key;
    const lines = [formatTaggedStats(group.statProfile), ""];
    appendSection(lines, t("preview.section.enhancements"), formatEnhancements(unit));
    appendSection(lines, t("preview.section.abilities"), formatTaggedAbilities(army, unit, group, t));
    appendSection(lines, t("preview.section.ranged"), formatTaggedWeapons(unit, group, "ranged"));
    appendSection(lines, t("preview.section.melee"), formatTaggedWeapons(unit, group, "melee"));
    lines.push(`[94A3B8]${t("preview.label.keywords")}:[-]`);
    lines.push(group.keywords.allModels.join(", ") || "-");
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  };

  const formatStats = (profile) => profile ? {
    M: profile.movement,
    T: profile.toughness,
    SV: profile.save,
    INV: profile.invulnerableSave,
    W: profile.wounds,
    LD: profile.leadership,
    OC: profile.objectiveControl
  } : null;

  const formatWeapon = (weapon) => weapon ? {
    name: weapon.name,
    type: weapon.mode,
    range: weapon.range,
    A: weapon.attacks,
    BS_WS: weapon.skill,
    S: weapon.strength,
    AP: weapon.ap,
    D: weapon.damage,
    rules: weapon.rules
  } : null;

  const csvCell = (cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`;
  const singularModelName = (name, index) => `${name.replace(/s\b/i, "")} #${index}`;

  const withRowIdentity = (group, rowMode, index = null) => {
    const originalModelName = group.originalModelName || group.modelName;
    const rowIndex = index === null ? null : index + 1;
    const rowKey = [group.unitId, group.id, rowMode, rowIndex ?? "group"].join("::");
    return { ...group, originalModelName, rowMode, rowIndex, rowKey };
  };

  const appendSection = (lines, title, sectionLines) => {
    lines.push(`[FFA500]--- ${title} ---[-]`);
    lines.push(...(sectionLines.length ? sectionLines : ["-"]));
    lines.push("");
  };

  const formatTaggedStats = (profile) => {
    if (!profile) return "[86EFAC]M(-) T(-) Sv(-/-) W(-) Ld(-) OC(-)[-]";
    const invulnerable = profile.invulnerableSave || "-";
    return `[86EFAC]M(${profile.movement}) T(${profile.toughness}) Sv(${profile.save}/${invulnerable}) W(${profile.wounds}) Ld(${profile.leadership}) OC(${profile.objectiveControl})[-]`;
  };

  const formatEnhancements = (unit) => (unit.enhancements || [])
    .map((enhancement) => `[D8B4FE]${enhancement.name || enhancement}:[-] ${enhancement.description || ""}`.trim());

  const formatTaggedAbilities = (army, unit, group, t) => {
    const lines = [];
    const faction = unit.faction || army?.faction;
    if (faction) lines.push(`[D8B4FE]\u3010${t("preview.label.faction")}\u3011:[-] ${faction}`);
    group.matchedAbilities.forEach((ability) => {
      const name = ability.name === "Invulnerable Save" ? t("preview.label.invulnSave") : ability.name === "Core Abilities" ? t("preview.label.coreAbilities") : ability.name;
      lines.push(`[D8B4FE]${name}:[-] ${ability.description || ability.rawText || ""}`.trim());
    });
    return lines;
  };

  const formatTaggedWeapons = (unit, group, mode) => {
    const seen = new Set();
    return group.matchedWeapons
      .map((match) => {
        const weapon = unit.weapons.find((profile) => profile.id === match.weaponProfileId);
        if (!weapon || weapon.mode !== mode || seen.has(match.weaponProfileId)) return "";
        seen.add(match.weaponProfileId);
        const count = Math.max(1, group.count > 1 ? match.quantityTotal || match.quantityPerModel || 1 : match.quantityPerModel || 1);
        const suffix = count > 1 ? ` *${count}` : "";
        const rules = weapon.rules.length ? `[C4B5FD][${weapon.rules.join(", ")}][-]` : "[C4B5FD][-]";
        return [
          `[FFFFFF]${weapon.name}${suffix}[-]`,
          `${weapon.range} [808080]|[-] A:[FFFF00]${weapon.attacks}[-] [808080]|[-] ${weapon.skillLabel}:[FFFF00]${weapon.skill}[-] [808080]|[-] S:[00FFFF]${weapon.strength}[-] [808080]|[-] AP:[00FFFF]${weapon.ap}[-] [808080]|[-] D:[00FFFF]${weapon.damage}[-]`,
          rules,
          ""
        ].join("\n");
      })
      .filter(Boolean);
  };


  // assets/js/pdfReader.js
  const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

  const readPdfText = async (file, onProgress = () => {}) => {
    const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    const isFileProtocol = window.location.protocol === "file:";

    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data, disableWorker: isFileProtocol }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress({ pageNumber, pageCount: pdf.numPages });
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push({ pageNumber, text: itemsToText(content.items) });
    }

    return {
      pages,
      fullText: pages.map((page) => `--- PAGE ${page.pageNumber} ---\n${page.text}`).join("\n\n")
    };
  };

  const itemsToText = (items) => {
    const sorted = [...items].sort((a, b) => {
      const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
      return Math.abs(yDiff) > 4 ? yDiff : a.transform[4] - b.transform[4];
    });

    const rows = [];
    let current = [];
    let currentY = null;

    sorted.forEach((item) => {
      const text = item.str.trim();
      if (!text) return;
      const y = Math.round(item.transform[5]);
      if (currentY === null || Math.abs(y - currentY) <= 4) {
        current.push(text);
        currentY = currentY ?? y;
        return;
      }
      rows.push(current.join(" "));
      current = [text];
      currentY = y;
    });

    if (current.length) rows.push(current.join(" "));
    return rows.join("\n");
  };


  // assets/js/app.js
  
  
  const dom = {
    dropZone: document.querySelector("#dropZone"),
    fileInput: document.querySelector("#fileInput"),
    parseButton: document.querySelector("#parseButton"),
    status: document.querySelector("#status"),
    themeToggleButton: document.querySelector("#themeToggleButton"),
    downloadJsonButton: document.querySelector("#downloadJsonButton"),
    downloadCsvButton: document.querySelector("#downloadCsvButton"),
    downloadHtmlButton: document.querySelector("#downloadHtmlButton"),
    copyTableButton: document.querySelector("#copyTableButton"),
    togglePreviewButton: document.querySelector("#togglePreviewButton"),
    copyPreviewButton: document.querySelector("#copyPreviewButton"),
    previewCopyInlineBtn: document.querySelector("#previewCopyInlineBtn"),
    toggleRawButton: document.querySelector("#toggleRawButton"),
    toggleWarningsButton: document.querySelector("#toggleWarningsButton"),
    viewModeButton: document.querySelector("#viewModeButton"),
    unitList: document.querySelector("#unitList"),
    armyTitle: document.querySelector("#armyTitle"),
    armyMeta: document.querySelector("#armyMeta"),
    searchInput: document.querySelector("#searchInput"),
    topSection: document.querySelector("#top"),
    tableSection: document.querySelector("#tableSection"),
    tablePanelBody: document.querySelector("#tablePanelBody"),
    modelCountBadge: document.querySelector("#modelCountBadge"),
    modelTableBody: document.querySelector("#modelTableBody"),
    warningPanel: document.querySelector("#warningSection"),
    warningPanelBody: document.querySelector("#warningPanelBody"),
    warningCountBadge: document.querySelector("#warningCountBadge"),
    warningList: document.querySelector("#warningList"),
    rawPanel: document.querySelector("#rawSection"),
    rawPanelBody: document.querySelector("#rawPanelBody"),
    rawPageBadge: document.querySelector("#rawPageBadge"),
    rawTextPreview: document.querySelector("#rawTextPreview"),
    previewPanel: document.querySelector("#previewSection"),
    previewPanelBody: document.querySelector("#previewPanelBody"),
    previewSelect: document.querySelector("#previewSelect"),
    previewModelBadge: document.querySelector("#previewModelBadge"),
    taggedPreview: document.querySelector("#taggedPreview"),
    sectionToggleButtons: document.querySelectorAll("[data-section-toggle]"),
    sectionTabButtons: document.querySelectorAll("[data-target-panel]"),
    langToggleButton: document.querySelector("#langToggleButton"),
    editionToggleButton: document.querySelector("#editionToggleButton"),
    sidebarToggle: document.querySelector("#sidebarToggle"),
    mainSidebar: document.querySelector("#mainSidebar")
  };
  
  let selectedFile = null;
  let pdfText = null;
  let army = null;
  let expandedModels = true;
  let selectedPreviewKey = "";
  let collapsedUnits = new Set();
  let theme = localStorage.getItem("warogan-theme") || "day";
  let sidebarCollapsed = localStorage.getItem("warogan-sidebar") === "1";
  let edition = localStorage.getItem("warogan-edition") || "10";
  const sectionState = {
    table: true,
    preview: false,
    raw: false,
    warnings: false
  };
  const sections = {
    table: { panel: dom.tableSection, body: dom.tablePanelBody },
    preview: { panel: dom.previewPanel, body: dom.previewPanelBody },
    raw: { panel: dom.rawPanel, body: dom.rawPanelBody },
    warnings: { panel: dom.warningPanel, body: dom.warningPanelBody }
  };
  
  const bindEvents = () => {
    dom.fileInput.addEventListener("change", () => handleFile(dom.fileInput.files[0]));
    dom.parseButton.addEventListener("click", parseCurrentFile);
    dom.themeToggleButton.addEventListener("click", toggleTheme);
    dom.downloadJsonButton.addEventListener("click", () => download("warogan-models.json", "application/json", JSON.stringify(buildExportArmy(army), null, 2)));
    dom.downloadCsvButton.addEventListener("click", () => download("warogan-models.csv", "text/csv;charset=utf-8", buildCsv(army, getVisibleRows())));
    dom.downloadHtmlButton.addEventListener("click", () => download("warogan-models.html", "text/html;charset=utf-8", buildHtmlTable(getVisibleRows())));
    dom.copyTableButton.addEventListener("click", copyCurrentTable);
    dom.togglePreviewButton.addEventListener("click", () => toggleSection("preview"));
    dom.copyPreviewButton.addEventListener("click", copyPreview);
    dom.previewCopyInlineBtn.addEventListener("click", copyPreview);
    dom.toggleRawButton.addEventListener("click", () => toggleSection("raw"));
    dom.toggleWarningsButton.addEventListener("click", () => toggleSection("warnings"));
    dom.viewModeButton.addEventListener("click", toggleViewMode);
    dom.sectionToggleButtons.forEach((button) => {
      button.addEventListener("click", () => toggleSection(button.dataset.sectionToggle));
    });
    dom.sectionTabButtons.forEach((button) => {
      button.addEventListener("click", () => navigateToSection(button.dataset.targetPanel));
    });
    dom.previewSelect.addEventListener("change", () => {
      selectedPreviewKey = dom.previewSelect.value;
      renderPreview();
    });
    dom.searchInput.addEventListener("input", () => {
      selectedPreviewKey = "";
      render();
    });
  
    ["dragenter", "dragover"].forEach((eventName) => {
      dom.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dom.dropZone.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      dom.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dom.dropZone.classList.remove("is-dragging");
      });
    });
    dom.dropZone.addEventListener("drop", (event) => handleFile(event.dataTransfer.files[0]));
  
    dom.langToggleButton.addEventListener("click", () => {
      window.i18n.setLang(window.i18n.lang === "zh" ? "en" : "zh");
    });
    dom.editionToggleButton.addEventListener("click", toggleEdition);
    document.addEventListener("langchange", () => {
      applyTheme();
      updateSectionControls();
      updateEditionControl();
      render();
    });

    dom.sidebarToggle.addEventListener("click", toggleSidebar);
  };
  
  const handleFile = (file) => {
    if (!file) return;
    selectedFile = file;
    pdfText = null;
    army = null;
    selectedPreviewKey = "";
    dom.parseButton.disabled = !/\.pdf$/i.test(file.name) && file.type !== "application/pdf";
    setStatus(dom.parseButton.disabled ? window.i18n.t('status.noFile') : window.i18n.t('status.fileReady', { filename: file.name }), dom.parseButton.disabled);
    render();
  };
  
  const parseCurrentFile = async () => {
    if (!selectedFile) return;
    setBusy(true);
    try {
      setStatus(window.i18n.t('status.reading', { filename: selectedFile.name }));
      pdfText = await readPdfText(selectedFile, ({ pageNumber, pageCount }) => setStatus(window.i18n.t('status.readingPage', { pageNumber, pageCount })));
      setStatus(window.i18n.t('status.parsing'));
      army = getParser(edition)(pdfText.fullText, selectedFile.name);
      collapsedUnits = new Set();
      selectedPreviewKey = "";
      const modelGroupCount = army.units.reduce((sum, unit) => sum + unit.modelGroups.length, 0);
      setStatus(window.i18n.t('status.parseComplete', { unitCount: army.units.length, modelGroupCount, warningCount: army.parseWarnings.length }));
      render();
    } catch (error) {
      setStatus(window.i18n.t('status.parseError', { error: error.message }), true);
    } finally {
      setBusy(false);
    }
  };
  
  const render = () => {
    const hasArmy = Boolean(army);
    updateEditionControl();
    [
      dom.downloadJsonButton,
      dom.downloadCsvButton,
      dom.downloadHtmlButton,
      dom.copyTableButton,
      dom.togglePreviewButton,
      dom.copyPreviewButton,
      dom.previewCopyInlineBtn,
      dom.toggleRawButton,
      dom.toggleWarningsButton,
      dom.viewModeButton,
      dom.searchInput,
      dom.previewSelect
    ].forEach((element) => { element.disabled = !hasArmy; });
  
    updateSectionControls();
    updateViewModeControl();
    renderMeta();
    renderUnitList();
    renderTable();
    renderPreview();
    renderWarnings();
    renderRaw();
  };
  
  const renderMeta = () => {
    if (!army) {
      dom.armyTitle.textContent = window.i18n.t('army.noTitle');
      dom.armyMeta.textContent = window.i18n.t('army.noMeta');
      return;
    }
    const modelGroups = army.units.reduce((sum, unit) => sum + unit.modelGroups.length, 0);
    dom.armyTitle.textContent = army.title || "Warhammer 40,000 10th Edition";
    dom.armyMeta.textContent = `${army.sourceFileName} | ${army.units.length} units | ${modelGroups} model groups | ${army.parseWarnings.length} warnings`;
  };
  
  const renderUnitList = () => {
    if (!army?.units.length) {
      dom.unitList.innerHTML = `<div class="empty">${window.i18n.t('units.empty')}</div>`;
      return;
    }
    dom.unitList.innerHTML = army.units.map((unit) => `
      <button class="unit-button ${collapsedUnits.has(unit.id) ? "" : "is-active"}" type="button" data-unit-id="${escapeHtml(unit.id)}">
        <span class="unit-name">${escapeHtml(unit.name)}</span>
        <span class="unit-meta">${unit.points ?? "-"} pts | ${unit.modelGroups.length} model groups | ${unit.parseWarnings.length} warnings</span>
      </button>
    `).join("");
    dom.unitList.querySelectorAll("[data-unit-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const { unitId } = button.dataset;
        if (collapsedUnits.has(unitId)) collapsedUnits.delete(unitId);
        else collapsedUnits.add(unitId);
        selectedPreviewKey = "";
        render();
      });
    });
  };
  
  const renderTable = () => {
    const rows = getVisibleRows();
    dom.modelCountBadge.textContent = String(rows.length);
    if (!rows.length) {
      const msg = army ? window.i18n.t('table.noResults') : window.i18n.t('table.noData');
      dom.modelTableBody.innerHTML = `<tr><td colspan="9" class="empty">${msg}</td></tr>`;
      return;
    }
    dom.modelTableBody.innerHTML = rows.map(({ unit, group }) => `
      <tr>
        <td>${escapeHtml(unit.name)}<br><span class="muted">${unit.points ?? "-"} pts</span></td>
        <td>${escapeHtml(group.modelName)}</td>
        <td>${group.count}</td>
        <td>${escapeHtml(renderStats(group.statProfile))}</td>
        <td>${renderEquipment(group)}</td>
        <td>${escapeHtml(renderWeapons(unit, group)).replace(/\n/g, "<br>") || "-"}</td>
        <td>${renderChips(group.matchedAbilities.map((ability) => ability.name))}</td>
        <td>${renderChips(group.keywords.allModels)}</td>
        <td>${renderWarningCodes(unit, group)}</td>
      </tr>
    `).join("");
  };
  
  const renderPreview = () => {
    const rows = getVisibleRows();
    if (!rows.length) {
      dom.previewSelect.innerHTML = "";
      dom.previewSelect.disabled = true;
      dom.previewModelBadge.textContent = window.i18n.t('preview.noModel');
      dom.taggedPreview.textContent = window.i18n.t('preview.empty');
      return;
    }
  
    const keyedRows = rows.map((row) => ({ ...row, key: getRowKey(row) }));
    if (!keyedRows.some((row) => row.key === selectedPreviewKey)) {
      selectedPreviewKey = keyedRows[0].key;
    }
  
    dom.previewSelect.disabled = false;
    dom.previewSelect.innerHTML = keyedRows.map(({ unit, group, key }) => (
      `<option value="${escapeHtml(key)}">${escapeHtml(unit.name)} / ${escapeHtml(group.modelName)} x${group.count}</option>`
    )).join("");
    dom.previewSelect.value = selectedPreviewKey;
  
    const selected = keyedRows.find((row) => row.key === selectedPreviewKey) || keyedRows[0];
    dom.previewModelBadge.textContent = `${selected.unit.name} / ${selected.group.modelName} x${selected.group.count}`;
    dom.taggedPreview.textContent = buildTaggedPreview(army, selected.unit, selected.group);
  };
  
  const getVisibleRows = () => {
    if (!army) return [];
    const query = dom.searchInput.value.trim().toLowerCase();
    return flattenRows(army, expandedModels)
      .filter(({ unit }) => !collapsedUnits.has(unit.id))
      .filter(({ unit, group }) => {
        if (!query) return true;
        const text = [
          unit.name,
          group.modelName,
          group.equipmentItems.map((item) => item.name).join(" "),
          group.matchedAbilities.map((ability) => ability.name).join(" "),
          group.keywords.allModels.join(" ")
        ].join(" ").toLowerCase();
        return text.includes(query);
      });
  };
  
  const renderEquipment = (group) => {
    if (!group.equipmentItems.length) return "-";
    return `<div class="chips">${group.equipmentItems.map((item) => {
      const label = item.isWeapon ? item.name : `${item.name} *`;
      return `<span class="chip" title="${escapeHtml(item.matchConfidence)}">${escapeHtml(label)}</span>`;
    }).join("")}</div>`;
  };
  
  const renderChips = (values) => values.length
    ? `<div class="chips">${values.map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join("")}</div>`
    : "-";
  
  const renderWarningCodes = (unit, group) => {
    const warnings = getGroupWarnings(unit, group);
    return warnings.length ? renderChips(warnings.map((warning) => warning.code)) : "-";
  };
  
  const renderWarnings = () => {
    if (!army) {
      dom.warningCountBadge.textContent = "0";
      dom.warningList.innerHTML = `<div class="empty">${window.i18n.t('warnings.empty')}</div>`;
      return;
    }
    dom.warningCountBadge.textContent = String(army.parseWarnings.length);
    dom.warningList.innerHTML = army.parseWarnings.length
      ? army.parseWarnings.map((warning) => `
        <div class="warning">
          <strong>${escapeHtml(warning.code)}</strong> ${escapeHtml(warning.message)}
          <div>${escapeHtml([warning.unitName, warning.modelName].filter(Boolean).join(" / "))}</div>
          ${warning.rawText ? `<code>${escapeHtml(warning.rawText.slice(0, 500))}</code>` : ""}
        </div>
      `).join("")
      : `<div class="empty">${window.i18n.t('warnings.empty')}</div>`;
  };
  
  const renderRaw = () => {
    dom.rawPageBadge.textContent = `${pdfText?.pages.length || 0} pages`;
    dom.rawTextPreview.textContent = pdfText?.fullText || "";
  };
  
  const updateSectionControls = () => {
    Object.entries(sections).forEach(([sectionKey, section]) => {
      if (!section.panel) return;
      const isExpanded = Boolean(sectionState[sectionKey]);
      section.panel.classList.toggle("is-collapsed", !isExpanded);
      section.body?.setAttribute("aria-hidden", String(!isExpanded));
    });
  
    dom.sectionToggleButtons.forEach((button) => {
      const sectionKey = button.dataset.sectionToggle;
      const isExpanded = Boolean(sectionState[sectionKey]);
      button.textContent = window.i18n.t(isExpanded ? "section.collapse" : "section.expand");
      button.title = window.i18n.t(isExpanded ? "section.collapseTitle" : "section.expandTitle", {
        section: getSectionLabel(sectionKey)
      });
      button.setAttribute("aria-expanded", String(isExpanded));
    });
  
    dom.togglePreviewButton.textContent = sectionState.preview ? window.i18n.t('btn.hidePreview') : window.i18n.t('btn.showPreview');
    dom.toggleRawButton.textContent = sectionState.raw ? window.i18n.t('btn.hideRaw') : window.i18n.t('btn.showRaw');
    dom.toggleWarningsButton.textContent = sectionState.warnings ? window.i18n.t('btn.hideWarnings') : window.i18n.t('btn.showWarnings');
  };
  
  const getSectionLabel = (sectionKey) => window.i18n.t(`tabs.${sectionKey}`);
  
  const setSectionExpanded = (sectionKey, expanded) => {
    if (!(sectionKey in sectionState)) return;
    sectionState[sectionKey] = expanded;
    updateSectionControls();
  };
  
  const toggleSection = (sectionKey) => {
    setSectionExpanded(sectionKey, !sectionState[sectionKey]);
  };
  
  const navigateToSection = (sectionKey) => {
    if (sectionKey === "top") {
      dom.topSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSectionExpanded(sectionKey, true);
    window.requestAnimationFrame(() => {
      sections[sectionKey]?.panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  
  const toggleTheme = () => {
    theme = theme === "day" ? "night" : "day";
    localStorage.setItem("warogan-theme", theme);
    applyTheme();
  };

  const applyTheme = () => {
    document.body.dataset.theme = theme;
    dom.themeToggleButton.textContent = theme === "day" ? window.i18n.t('btn.theme.day') : window.i18n.t('btn.theme.night');
  };

  const toggleSidebar = () => {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem("warogan-sidebar", sidebarCollapsed ? "1" : "");
    applySidebar();
  };

  const applySidebar = () => {
    dom.mainSidebar.classList.toggle("is-collapsed", sidebarCollapsed);
    dom.sidebarToggle.title = sidebarCollapsed ? "展開側欄" : "收合側欄";
    dom.sidebarToggle.setAttribute("aria-label", sidebarCollapsed ? "展開側欄" : "收合側欄");
  };
  
  const toggleEdition = () => {
    edition = edition === "10" ? "11" : "10";
    localStorage.setItem("warogan-edition", edition);
    army = null;
    render();
    if (selectedFile && pdfText) parseCurrentFile();
  };

  const updateEditionControl = () => {
    dom.editionToggleButton.textContent = window.i18n.t(`btn.edition${edition}`);
    dom.editionToggleButton.dataset.edition = edition;
  };

  const toggleViewMode = () => {
    expandedModels = !expandedModels;
    selectedPreviewKey = "";
    render();
  };
  
  const updateViewModeControl = () => {
    dom.viewModeButton.textContent = expandedModels ? window.i18n.t('btn.viewIndividual') : window.i18n.t('btn.viewGroup');
    dom.viewModeButton.title = expandedModels ? window.i18n.t('tooltip.individual') : window.i18n.t('tooltip.group');
    dom.viewModeButton.classList.toggle("is-individual", expandedModels);
    dom.viewModeButton.classList.toggle("is-group", !expandedModels);
  };
  
  const copyCurrentTable = async () => {
    await copyText(buildCsv(army, getVisibleRows()), window.i18n.t('status.tableCopied'));
  };
  
  const copyPreview = async () => {
    await copyText(dom.taggedPreview.textContent, window.i18n.t('status.previewCopied'));
  };
  
  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setStatus(message);
  };
  
  const getRowKey = ({ unit, group }) => group.rowKey || `${unit.id}::${group.id}::${group.modelName}::${group.count}`;
  
  const download = (fileName, type, content) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  
  const setBusy = (busy) => {
    dom.parseButton.disabled = busy || !selectedFile;
    dom.fileInput.disabled = busy;
  };
  
  const setStatus = (message, isError = false) => {
    dom.status.textContent = message;
    dom.status.classList.toggle("is-error", isError);
  };
  
  setStatus(window.i18n.t('status.waiting'));
  applyTheme();
  applySidebar();
  updateEditionControl();
  bindEvents();
  render();
})();
