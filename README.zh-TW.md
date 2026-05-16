# WAROGAN PDF Model Parser

[English](./README.md)

WAROGAN PDF Model Parser 讀取從 WAROGAN 匯出的 Warhammer 40,000 roster PDF，將其轉換為可操作的結構化資料。載入 PDF、點擊解析，即可得到一張可搜尋的表格，列出你的軍隊名單中每個單位、模型、武器、技能與關鍵字，不需要帳號、不需要伺服器、不需要安裝任何東西。

此工具完全在瀏覽器中運行。下載倉庫後直接開啟 `index.html` 即可使用。

🔗 連結 https://keroro6262.github.io/40k-WAROGAN-PDF-Model-Parser/


## 功能

- 將 WAROGAN roster PDF 解析為單位與模型表格
- 在模型群模式（每個模型群一列）與逐模型模式（每個模型一列）之間切換
- 依模型名稱、裝備、技能與關鍵字搜尋
- 預覽 bracket color markup
- 匯出為 JSON、CSV 或獨立 HTML，或直接複製表格

## 快速開始

1. 下載或 clone 此倉庫。
2. 用瀏覽器開啟 `index.html`。
3. 選擇 WAROGAN roster PDF。
4. 點擊解析。

若瀏覽器封鎖本機檔案存取（`file:///`），請改用 HTTP 伺服器提供此資料夾：

```powershell
python -m http.server 8080
```

然後開啟 `http://127.0.0.1:8080/`。在 Windows 上也可以執行 `.\start-server.ps1`。

## 使用限制

- 解析器讀取的是 PDF 內嵌的文字。如果你的 PDF 是用掃描實體頁面的方式產生（無文字層），則無法使用。
- 解析器是依照 WAROGAN 目前的匯出格式撰寫的。若 WAROGAN 改變 roster 的產生方式，部分欄位可能在規則更新前無法正確解析。
- 技能、關鍵字與裝備的歸屬是透過規則比對，而非資料庫。當解析器對某個項目的歸屬不確定時，會將其標記為警告，讓你自行確認。
- 此工具不包含任何 Games Workshop 或 WAROGAN 的官方資料，只讀取你 PDF 中已有的內容。

---

貢獻者與開發者文件請見 [工程規範.md](./工程規範.md)。
