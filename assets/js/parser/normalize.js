export const WARNING_CODES = {
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

export const normalizeText = (rawText = "") => {
  let text = rawText
    .replace(/\r\n?/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
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

export const normalizeName = (name = "") => name
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[–—]/g, "-")
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

export const displayName = (name = "") => name.replace(/\s+/g, " ").trim();

export const normalizeModelScope = (name = "") => displayName(name)
  .replace(/^[??•*-]\s*/, "")
  .replace(/\([^)]*\)/g, "")
  .replace(/[.,:;|]+$/g, "")
  .trim();

export const baseWeaponName = (name = "") => displayName(name)
  .replace(/\s+-\s+(standard|supercharge|strike|sweep|prioris|sanctorum|focused|dispersed|single|sustained).*$/i, "")
  .trim();

export const createId = (prefix, text, index = 0) => {
  const slug = normalizeName(text).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${prefix}-${slug || "item"}-${index + 1}`;
};

export const createWarning = (code, message, context = {}) => ({
  level: context.level || "warning",
  code,
  message,
  unitName: context.unitName,
  modelName: context.modelName,
  rawText: context.rawText
});

export const splitList = (value = "") => value
  .replace(/\s+and\s+/gi, ", ")
  .split(",")
  .map((item) => item.trim().replace(/[.;]+$/g, ""))
  .filter(Boolean);

export const parseQuantityName = (value = "") => {
  const match = value.trim().match(/^(\d+)\s+(.+)$/);
  return match
    ? { quantity: Number(match[1]), name: displayName(match[2]) }
    : { quantity: 1, name: displayName(value) };
};

export const includesName = (left, right) => {
  const a = normalizeName(left);
  const b = normalizeName(right);
  return Boolean(a && b && (a.includes(b) || b.includes(a)));
};

export const matchConfidence = (left, right) => {
  const leftNorm = normalizeName(left);
  const rightNorm = normalizeName(right);
  if (left === right) return "exact";
  if (leftNorm === rightNorm) return "normalized";
  if (leftNorm && rightNorm && (leftNorm.includes(rightNorm) || rightNorm.includes(leftNorm))) return "fuzzy";
  return null;
};

export const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

export const unique = (values) => [...new Set(values.map((value) => displayName(value)).filter(Boolean))];
