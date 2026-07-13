# 冒險記錄

一個可部署到 GitHub Pages 的 DND / TRPG 冒險筆記工具。支援樹狀劇情筆記、詞條庫、可拖曳心智圖、版本備份、Google Sheets 雲端同步，以及 Google Drive 圖片連結。

## 使用方式

1. 將本專案上傳到 GitHub。
2. 到 Repository 的 `Settings > Pages` 啟用 GitHub Pages。
3. 開啟 Pages 網址後，先點右上角「未連結雲端」。
4. 依照畫面指示部署 `google-apps-script/Code.gs.example`。
5. 將 Google Apps Script 的 Web App URL 貼回網頁。

若要沿用既有試算表，請將該試算表完整網址貼到 `Code.gs.example` 最上方的 `SPREADSHEET_SOURCE`，再部署 Apps Script 新版本。

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
- `google-apps-script/Code.gs.example`：Google Apps Script 同步後端範本。

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
