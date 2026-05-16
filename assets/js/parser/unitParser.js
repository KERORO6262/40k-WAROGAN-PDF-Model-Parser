import { assignAbilitiesToModels, parseAbilities } from "./abilityParser.js";
import { assignKeywordsToModels, parseKeywords } from "./keywordParser.js";
import { attachStatProfiles, matchEquipmentToWeapons, parseModelLoadouts, parseModelStatProfiles } from "./modelParser.js";
import { createId, createWarning, normalizeText, WARNING_CODES } from "./normalize.js";
import { parseWeapons } from "./weaponParser.js";

const UNIT_TITLE = /^(.+?)\s*\[(\d+)\s*pts\]\s*$/i;
const BAD_TITLES = /^(Enhancement|Enhancements|Stratagems|Core Stratagems|Army Roster|Roster|Detachment)/i;

export const parseArmy = (rawText, sourceFileName = "WAROGAN.pdf") => {
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

export const splitUnitBlocks = (fullText) => {
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

export const parseUnitBlock = (rawBlock, index = 0) => {
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
