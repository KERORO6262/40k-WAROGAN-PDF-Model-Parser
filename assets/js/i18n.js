(() => {
  const STRINGS = {
    zh: {
      'brand.desc':         'Warhammer 40,000 10版模型級資料解析工具',
      'file.label':         '匯入 PDF',
      'file.hint':          '選擇或拖放 WAROGAN 匯出的 roster PDF',
      'btn.parse':          '解析',
      'btn.theme.day':      '夜間模式',
      'btn.theme.night':    '白天模式',
      'btn.downloadJson':   '下載 JSON',
      'btn.downloadCsv':    '下載 CSV',
      'btn.downloadHtml':   '下載 HTML',
      'btn.copyTable':      '複製目前表格',
      'btn.showPreview':    '顯示格式預覽',
      'btn.hidePreview':    '隱藏格式預覽',
      'btn.copyPreview':    '複製格式預覽',
      'btn.showRaw':        '顯示原始文字',
      'btn.hideRaw':        '隱藏原始文字',
      'btn.showWarnings':   '顯示解析警告',
      'btn.hideWarnings':   '隱藏解析警告',
      'btn.viewIndividual': '逐模型模式',
      'btn.viewGroup':      '模型群模式',
      'tooltip.individual': '目前以逐模型顯示，點擊切換為模型群。',
      'tooltip.group':      '目前以模型群顯示，點擊切換為逐模型。',
      'status.waiting':     '等待 PDF 匯入。',
      'status.noFile':      '請選擇 PDF 檔案。',
      'status.fileReady':   '已選擇 {filename}，可以開始解析。',
      'status.reading':     '讀取 {filename}...',
      'status.readingPage': '讀取 PDF 第 {pageNumber} / {pageCount} 頁...',
      'status.parsing':     '解析 WAROGAN 單位、模型、武器與技能資料...',
      'status.parseComplete': '解析完成：{unitCount} units，{modelGroupCount} model groups，{warningCount} warnings。',
      'status.parseError':  '解析失敗：{error}',
      'status.tableCopied': '目前表格已複製為 CSV。',
      'status.previewCopied': '格式預覽已複製。',
      'army.noTitle':       '尚未載入 roster',
      'army.noMeta':        '匯入 PDF 後會顯示單位、模型群與警告數。',
      'search.placeholder': '搜尋模型、裝備、能力、詞條',
      'table.heading':      '模型級表格',
      'table.noData':       '尚未解析資料。',
      'table.noResults':    '沒有符合條件的模型資料。',
      'warnings.heading':   '解析警告',
      'warnings.empty':     '沒有警告。',
      'raw.heading':        '原始文字預覽',
      'preview.heading':    '格式預覽',
      'preview.noModel':    '尚未選擇模型',
      'preview.empty':      '解析後會在這裡顯示 bracket color markup 預覽。',
      'units.empty':        '尚未解析單位。',
      'tabs.top':           '最上方',
      'tabs.table':         '表格',
      'tabs.preview':       '格式預覽',
      'tabs.raw':           '原始文字',
      'tabs.warnings':      '解析警告',
      'section.expand':     '展開',
      'section.collapse':   '收合',
      'section.expandTitle': '展開{section}',
      'section.collapseTitle': '收合{section}',
    },
    en: {
      'brand.desc':         'Warhammer 40,000 10th Edition Model-level Roster Parser',
      'file.label':         'Import PDF',
      'file.hint':          'Select or drop a WAROGAN exported roster PDF',
      'btn.parse':          'Parse',
      'btn.theme.day':      'Night Mode',
      'btn.theme.night':    'Day Mode',
      'btn.downloadJson':   'Download JSON',
      'btn.downloadCsv':    'Download CSV',
      'btn.downloadHtml':   'Download HTML',
      'btn.copyTable':      'Copy Current Table',
      'btn.showPreview':    'Show Format Preview',
      'btn.hidePreview':    'Hide Format Preview',
      'btn.copyPreview':    'Copy Format Preview',
      'btn.showRaw':        'Show Raw Text',
      'btn.hideRaw':        'Hide Raw Text',
      'btn.showWarnings':   'Show Parse Warnings',
      'btn.hideWarnings':   'Hide Parse Warnings',
      'btn.viewIndividual': 'Individual Mode',
      'btn.viewGroup':      'Group Mode',
      'tooltip.individual': 'Currently showing individual models. Click to switch to model groups.',
      'tooltip.group':      'Currently showing model groups. Click to switch to individual models.',
      'status.waiting':     'Waiting for PDF import.',
      'status.noFile':      'Please select a PDF file.',
      'status.fileReady':   'Selected {filename}, ready to parse.',
      'status.reading':     'Reading {filename}...',
      'status.readingPage': 'Reading PDF page {pageNumber} / {pageCount}...',
      'status.parsing':     'Parsing WAROGAN units, models, weapons, and abilities...',
      'status.parseComplete': 'Parse complete: {unitCount} units, {modelGroupCount} model groups, {warningCount} warnings.',
      'status.parseError':  'Parse failed: {error}',
      'status.tableCopied': 'Current table copied as CSV.',
      'status.previewCopied': 'Format preview copied.',
      'army.noTitle':       'No roster loaded',
      'army.noMeta':        'Import a PDF to view units, model groups, and warnings.',
      'search.placeholder': 'Search models, equipment, abilities, keywords',
      'table.heading':      'Model-level Table',
      'table.noData':       'No data parsed yet.',
      'table.noResults':    'No matching model data.',
      'warnings.heading':   'Parse Warnings',
      'warnings.empty':     'No warnings.',
      'raw.heading':        'Raw Text Preview',
      'preview.heading':    'Format Preview',
      'preview.noModel':    'No model selected',
      'preview.empty':      'Parse a roster to preview bracket color markup here.',
      'units.empty':        'No units parsed yet.',
      'tabs.top':           'Top',
      'tabs.table':         'Table',
      'tabs.preview':       'Format Preview',
      'tabs.raw':           'Raw Text',
      'tabs.warnings':      'Parse Warnings',
      'section.expand':     'Expand',
      'section.collapse':   'Collapse',
      'section.expandTitle': 'Expand {section}',
      'section.collapseTitle': 'Collapse {section}',
    }
  };

  window.i18n = {
    lang: localStorage.getItem('warogan-lang') || 'zh',

    t(key, vars) {
      let str = (STRINGS[this.lang] || STRINGS.zh)[key] ?? (STRINGS.zh)[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
      }
      return str;
    },

    setLang(lang) {
      this.lang = lang;
      localStorage.setItem('warogan-lang', lang);
      this.applyToDOM();
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    },

    applyToDOM() {
      document.documentElement.lang = this.lang === 'zh' ? 'zh-Hant' : 'en';

      document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = this.t(el.getAttribute('data-i18n'));
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
      });

      const langBtn = document.querySelector('#langToggleButton');
      if (langBtn) langBtn.textContent = this.lang === 'zh' ? 'EN' : '中文';
    }
  };

  window.i18n.applyToDOM();
})();
