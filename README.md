這是一個 React 建置的前端專案，主要功能是讓使用者上傳影片，並搭配後端 API 顯示轉檔結果、字幕處理狀態與影片資訊。
介面設計簡單直覺，並支援上傳時的載入動畫、進度顯示與錯誤提示。

🚀 功能特點

上傳影片（MP4 / MOV / 等常見格式）

上傳時顯示 Loading / Spinner

呼叫後端 API 取得處理結果

顯示字幕、自動轉檔資訊

支援跨來源請求（CORS）

使用 React Hooks 寫法，易於維護

🛠️ 使用技術

React + Vite / CRA

Axios / fetch

React-spinner

CSS Modules / SCSS

📦 安裝與啟動
```
npm install
npm run dev
```

🔗 後端專案

後端程式碼請參考：
<https://github.com/xiu43317/upLoadVideo_backend>

📝 專案架構（範例）
```
src/
 ├── components/
 ├── pages/
 ├── hooks/
 ├── utils/
 ├── App.jsx
 └── main.jsx
```
