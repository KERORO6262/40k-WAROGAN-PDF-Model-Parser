# WAROGAN PDF Model Parser

[繁體中文](./README.zh-TW.md)

WAROGAN PDF Model Parser reads a Warhammer 40,000 roster PDF exported from WAROGAN and turns it into structured data you can work with. Drop in a PDF, hit parse, and get a searchable table of every unit, model, weapon, ability, and keyword in your army list — no account, no server, no install required.

The tool runs entirely in the browser. Download the repository and open `index.html`. That's it.

## Features

- Parse a WAROGAN roster PDF into a unit and model table
- Switch between grouped view (one row per model group) and individual view (one row per model)
- Search across model names, equipment, abilities, and keywords
- Preview bracket color markup
- Export to JSON, CSV, or standalone HTML — or copy the table directly

## Getting Started

1. Download or clone this repository.
2. Open `index.html` in a browser.
3. Select a WAROGAN roster PDF.
4. Click parse.

If your browser blocks local file access (`file:///`), serve the folder over HTTP instead:

```powershell
python -m http.server 8080
```

Then open `http://127.0.0.1:8080/`. On Windows you can also run `.\start-server.ps1`.

## Limitations

- The parser reads text embedded in the PDF. If your PDF was created by scanning a physical page (no text layer), it will not work.
- The parser is written against WAROGAN's current export format. If WAROGAN changes how it generates rosters, some fields may stop parsing correctly until the rules are updated.
- Abilities, keywords, and equipment are matched using pattern rules, not a database. When the parser is uncertain about an item's ownership, it marks it as a warning so you can review it.
- This tool does not contain any official Games Workshop or WAROGAN data. It only reads what is already written in your PDF.

---

For contributor and developer documentation, see [工程規範.md](./工程規範.md).
