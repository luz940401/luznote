# 冒險記錄

一個可部署到 GitHub Pages 的 DND / TRPG 冒險筆記工具。支援樹狀劇情筆記、詞條庫、可拖曳心智圖、遊戲幻燈片、版本備份、Google Sheets 雲端同步，以及 Google Drive 媒體檔案。

## 使用方式

1. 將本專案上傳到 GitHub。
2. 到 Repository 的 `Settings > Pages` 啟用 GitHub Pages。
3. 開啟 Pages 網址後，先點右上角「未連結雲端」。
4. 依照畫面指示部署 `google-apps-script/Code.gs.example`。
5. 將 Google Apps Script 的 Web App URL 貼回網頁。

若要沿用既有試算表，請在 Apps Script 的「專案設定 > 指令碼屬性」新增 `SPREADSHEET_ID`，值填入原試算表網址中 `/d/` 與 `/edit` 之間的 ID，再部署 Apps Script 新版本。程式未設定 ID 時會停止並回報錯誤，不會另建一份空白試算表。

舊版若採用 `A1=meta`、A 欄節點 ID、B 欄節點 JSON 的逐列格式，新版會自動唯讀相容。也可在 Apps Script 編輯器手動執行 `migrateLegacyRowsToModern()`，安全轉換到新的 `data` 分頁；原工作表不會被修改。

## 資料儲存

- 網頁檔案由 GitHub Pages 提供。
- 筆記資料預設先暫存在瀏覽器 `localStorage`。
- 設定 Google Apps Script 後，資料會同步到 Google Sheets。
- 雲端 JSON 會自動分段儲存在多個儲存格，避免超過 Google Sheets 單格字元上限。
- Google Drive 圖片請貼公開分享連結，程式會自動轉成可預覽的圖片網址。

## Google Drive 圖片

1. 上傳圖片到 Google Drive。
2. 對圖片按「共用」。
3. 權限設為「知道連結的任何人可查看」。
4. 貼上分享連結，例如：

```text
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

系統會自動轉為：

```text
https://drive.google.com/thumbnail?id=FILE_ID&sz=w1200
```

## 檔案說明

- `index.html`：主筆記頁，管理劇情節點與同步設定。
- `entities.html`：詞條庫，管理角色、組織、城鎮、物品等資料。
- `mindmap.html`：心智圖視圖，可拖曳節點位置並直接編輯節點內容。
- `slides.html`：16:9 遊戲幻燈片庫，可直接上傳圖片／PDF、記錄遊玩時間、地點與備註。
- `google-apps-script/Code.gs.example`：Google Apps Script 同步後端範本。

## 幻燈片上傳

- 更新 Apps Script 程式後，請建立並部署一個「新版本」，舊部署不會自動套用程式變更。
- 第一次上傳時，Apps Script 會在部署帳號的 Google Drive 建立「冒險記錄－幻燈片」資料夾，並把檔案設為知道連結者可查看。
- 可直接上傳 PNG、JPG、WebP、PDF，單檔上限 15 MB。大型 PDF 可改貼 Google Drive 公開分享網址；網頁只保存連結，因此不受網頁上傳大小限制。
- 幻燈片支援「選取刪除」批次移除。貼入的外部 Drive 檔案只會刪除幻燈片紀錄，不會刪除原始檔；由本系統直接上傳的檔案則會一併移到 Drive 垃圾桶。
- PDF 會使用 Drive 首頁縮圖；「管理頁面」可預覽每一頁並任意移除或復原。移除只影響幻燈片播放，不會破壞 Google Drive 原始 PDF，玩家播放時會自動跳過已移除頁面。
- PDF 頁面管理器可將任意一頁設為主要封面；系統會保存壓縮縮圖並同步到其他裝置，不必固定使用 PDF 第一頁。
- 播放時會依序走完 PDF 的保留頁面，再接續下一張幻燈片；往回瀏覽也會從上一份 PDF 的最後一個保留頁接回。
- 從 GitHub Pages 開啟時，可由 Apps Script 直接讀取設為「知道連結的任何人可查看」的 Drive PDF，不必再選擇本機檔案；保留頁碼、封面頁與封面縮圖會同步到 Google Sheets。
- 幻燈片修改會立即保存至雲端；其他裝置重新整理頁面或按「立即同步」時會讀取最新內容。
- 外部 Drive PDF 的雲端讀取上限為 30 MB。超過時仍可選擇本機同一份 PDF 作為頁面分析備援，檔案不會重新上傳。
- 圖片建議使用 16:9；其他比例仍可保存，但畫廊會裁切成 16:9 顯示。
- 若要使用既有資料夾，可在 Apps Script「指令碼屬性」設定 `MEDIA_FOLDER_ID`。

## 注意事項

不要把私人劇情資料、Google Apps Script 部署網址、Google Sheet ID 或任何帳號資訊直接提交到 GitHub。
## 心智圖管理者模式

- `mindmap.html` 預設是觀看模式，可以縮放、查看節點，但不能拖動板塊或儲存修改。
- 點「管理者」後，第一次會要求設定管理者密碼；之後輸入同一組密碼即可解鎖拖曳與編輯。
- 若要避免有 GitHub Pages 連結的人改動雲端心智圖位置，請在 Google Apps Script 的「專案設定 > 指令碼屬性」新增：

```text
ADMIN_TOKEN=你的管理者密碼
```

並重新部署 Web App。這樣心智圖位置變更會由 Apps Script 驗證管理者密碼，沒有正確 token 的寫入會被拒絕。
