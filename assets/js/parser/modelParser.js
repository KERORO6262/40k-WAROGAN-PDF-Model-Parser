import { createId, createWarning, displayName, includesName, matchConfidence, normalizeName, parseQuantityName, splitList, WARNING_CODES } from "./normalize.js";

const STAT_LINE = /^(.+?)\s+(\d+["']|-) ?\s+(\d+|-)\s+(\d\+|-)\s+(\d+|-)\s+(\d\+|-)\s+(\d+|-)\s*$/i;

export const parseModelLoadouts = (unitBlock, unitId) => {
  const beforeStats = unitBlock.split(/\nUnit\s+M\s+T\s+SV\s+W\s+LD\s+OC\b/i)[0] || unitBlock;
  const lines = normalizeLoadoutLines(beforeStats);

  return lines
    .map((line) => line.replace(/^[•*-]\s*/, "").trim())
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
    .map((line) => line.trim().replace(/^[??•*-]\s*/, "").trim())
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

export const parseModelStatProfiles = (unitBlock) => {
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

export const matchStatProfile = (modelGroup, statProfiles) => {
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

export const attachStatProfiles = (unit) => {
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

export const findEquipmentMatch = (equipmentName, weaponProfiles) => {
  const candidates = weaponProfiles
    .map((weapon) => ({
      weapon,
      confidence: matchConfidence(equipmentName, weapon.name) || matchConfidence(equipmentName, weapon.baseName)
    }))
    .filter((candidate) => candidate.confidence);

  const rank = { exact: 0, normalized: 1, fuzzy: 2 };
  return candidates.sort((a, b) => rank[a.confidence] - rank[b.confidence]);
};

export const matchEquipmentToWeapons = (unit) => {
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
