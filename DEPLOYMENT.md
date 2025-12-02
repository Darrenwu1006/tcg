# GitHub Deployment Guide

這份文件說明如何將程式碼更新到 GitHub 以及如何發布遊戲到 GitHub Pages。

## 1. 更新程式碼 (Routine Updates)

當你修改了程式碼並想要保存到 GitHub 儲存庫 (Repository) 時，請執行以下指令：

```bash
# 1. 加入所有修改的檔案
git add .

# 2. 提交修改 (請將 "修改說明" 替換成你實際做的更動)
git commit -m "修改說明"

# 3. 推送到 GitHub (main 分支)
git push
```

這只會更新程式碼庫，**不會** 更新線上的遊戲網頁。

## 2. 發布遊戲 (Deploy to GitHub Pages)

當你想要更新線上的遊戲網頁 (GitHub Pages) 時，請執行以下指令：

```bash
npm run deploy
```

這個指令會自動執行以下步驟：

1.  執行 `npm run build` 進行打包。
2.  將打包好的檔案 (`dist` 資料夾) 推送到 `gh-pages` 分支。

**注意**：發布後通常需要幾分鐘的時間，GitHub Pages 才會顯示最新的內容。

## 3. 常用連結

- **GitHub 儲存庫**: [https://github.com/Darrenwu1006/tcg](https://github.com/Darrenwu1006/tcg)
- **線上遊戲網址**: [https://Darrenwu1006.github.io/tcg/](https://Darrenwu1006.github.io/tcg/)

## 4. 注意事項

- **圖片/檔案路徑**: 由於發布在 `/tcg/` 子路徑下，程式碼中引用 `public` 資料夾內的資源時，請確保使用正確的路徑處理方式 (已在 `CardDatabase.ts` 中處理)。
- **本地預覽**: 使用 `npm run dev` 在本地開發時，網址通常是 `http://localhost:5173/` (沒有 `/tcg/` 後綴)，這是正常的。
