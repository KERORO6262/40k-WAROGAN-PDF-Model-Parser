import { buildCsv, buildExportArmy, buildHtmlTable, buildTaggedPreview, flattenRows, getGroupWarnings, renderStats, renderWeapons } from "./parser/exportBuilder.js";
import { escapeHtml } from "./parser/normalize.js";
import { parseArmy } from "./parser/unitParser.js";
import { readPdfText } from "./pdfReader.js";

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
  previewCopyInlineBtn: document.querySelector("#previewCopyInlineBtn"),
  previewModelBadge: document.querySelector("#previewModelBadge"),
  taggedPreview: document.querySelector("#taggedPreview"),
  sectionToggleButtons: document.querySelectorAll("[data-section-toggle]"),
  sectionTabButtons: document.querySelectorAll("[data-target-panel]"),
  langToggleButton: document.querySelector("#langToggleButton"),
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
  document.addEventListener("langchange", () => {
    applyTheme();
    updateSectionControls();
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
    army = parseArmy(pdfText.fullText, selectedFile.name);
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
  [
    dom.downloadJsonButton,
    dom.downloadCsvButton,
    dom.downloadHtmlButton,
    dom.copyTableButton,
    dom.togglePreviewButton,
    dom.copyPreviewButton,
    dom.toggleRawButton,
    dom.toggleWarningsButton,
    dom.viewModeButton,
    dom.searchInput,
    dom.previewSelect,
    dom.previewCopyInlineBtn
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
bindEvents();
render();
