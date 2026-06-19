import { parseArmy } from "../unitParser.js";

const EDITION_11_TITLE_FALLBACK = "Warhammer 40,000 11th Edition";
const EDITION_10_TITLE = "Warhammer 40,000 10th Edition";
const TABLE_HEADERS = [
  "Unit M T SV W LD OC",
  "Ranged Weapons Range A BS S AP D",
  "Melee Weapons Range A WS S AP D",
  "Abilities Description"
];

export const parse = (rawText, sourceFileName = "WAROGAN.pdf") => {
  const army = parseArmy(normalizeEdition11Text(rawText), sourceFileName);
  if (!army.title || army.title === EDITION_10_TITLE) {
    army.title = EDITION_11_TITLE_FALLBACK;
  }
  return army;
};

export const normalizeEdition11Text = (rawText = "") => {
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
  .replace(/^[^A-Za-z0-9(\[]+(?=\d*\s*[A-Za-z(\[])/g, "")
  .replace(/^\s*["']+\s*(?=\d*\s*[A-Za-z(\[])/u, "")
  .replace(/\s+/g, " ")
  .trim();

const isRepeatedUnitNameBeforeTitle = (line = "", nextLine = "") => {
  const title = nextLine.match(/^(.+?)\s*\[\d+\s*pts\]\s*$/i);
  return Boolean(title && line.toLowerCase() === title[1].trim().toLowerCase());
};
