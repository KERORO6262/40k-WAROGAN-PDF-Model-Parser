import { escapeHtml, unique } from "./normalize.js";
import { formatAbilities } from "./abilityParser.js";

export const buildExportArmy = (army) => ({
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

export const buildCsv = (army, rows) => {
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

export const buildHtmlTable = (rows) => `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><title>WAROGAN Model Export</title>
<style>body{font-family:Arial,sans-serif;margin:20px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ccc;padding:6px;vertical-align:top}th{background:#f4f4f4}</style></head>
<body><table><thead><tr><th>Unit</th><th>Model</th><th>Count</th><th>Stats</th><th>Equipment</th><th>Weapon Profiles</th><th>Abilities</th><th>Keywords</th><th>Warnings</th></tr></thead><tbody>
${rows.map(({ unit, group }) => `<tr><td>${escapeHtml(unit.name)}</td><td>${escapeHtml(group.modelName)}</td><td>${group.count}</td><td>${escapeHtml(renderStats(group.statProfile))}</td><td>${escapeHtml(group.equipmentItems.map((item) => item.name).join(", "))}</td><td>${escapeHtml(renderWeapons(unit, group))}</td><td>${escapeHtml(formatAbilities(group.matchedAbilities).join("; "))}</td><td>${escapeHtml(group.keywords.allModels.join(", "))}</td><td>${escapeHtml(getGroupWarnings(unit, group).map((warning) => warning.code).join("; "))}</td></tr>`).join("")}
</tbody></table></body></html>`;

export const flattenRows = (army, expanded = false) => army.units.flatMap((unit) => unit.modelGroups.flatMap((group) => {
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

export const getGroupWarnings = (unit, group) => {
  const modelName = group.originalModelName || group.modelName;
  return unit.parseWarnings.filter((warning) => !warning.modelName || warning.modelName === modelName);
};

export const renderStats = (profile) => profile
  ? `M ${profile.movement} / T ${profile.toughness} / SV ${profile.save} / INV ${profile.invulnerableSave || "-"} / W ${profile.wounds} / LD ${profile.leadership} / OC ${profile.objectiveControl}`
  : "-";

export const renderWeapons = (unit, group) => unique(group.matchedWeapons.map((match) => {
  const weapon = unit.weapons.find((profile) => profile.id === match.weaponProfileId);
  if (!weapon) return "";
  return `${weapon.name} (${weapon.mode}; ${weapon.range}, A ${weapon.attacks}, ${weapon.skillLabel} ${weapon.skill}, S ${weapon.strength}, AP ${weapon.ap}, D ${weapon.damage}${weapon.rules.length ? `; ${weapon.rules.join(", ")}` : ""})`;
})).join("\n");

export const buildTaggedPreview = (army, unit, group) => {
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
  if (faction) lines.push(`[D8B4FE]【${t("preview.label.faction")}】:[-] ${faction}`);
  group.matchedAbilities.forEach((ability) => {
    const name = ability.name === "Invulnerable Save" ? t("preview.label.invulnSave") : ability.name;
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
