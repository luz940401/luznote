# 冒險記錄

一個可部署到 GitHub Pages 的 DND / TRPG 冒險筆記工具。支援樹狀劇情筆記、詞條庫、可拖曳心智圖、版本備份、Google Sheets 雲端同步，以及 Google Drive 圖片連結。

## 使用方式

1. 將本專案上傳到 GitHub。
2. 到 Repository 的 `Settings > Pages` 啟用 GitHub Pages。
3. 開啟 Pages 網址後，先點右上角「未連結雲端」。
4. 依照畫面指示部署 `google-apps-script/Code.gs.example`。
5. 將 Google Apps Script 的 Web App URL 貼回網頁。

## 資料儲存

- 網頁檔案由 GitHub Pages 提供。
- 筆記資料預設先暫存在瀏覽器 `localStorage`。
- 設定 Google Apps Script 後，資料會同步到 Google Sheets。
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
