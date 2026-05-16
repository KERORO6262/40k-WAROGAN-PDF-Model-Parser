import { createWarning, displayName, includesName, normalizeModelScope, splitList, unique, WARNING_CODES } from "./normalize.js";

export const parseKeywords = (unitBlock) => {
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

export const assignKeywordsToModels = (unit) => {
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
