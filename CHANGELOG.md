## 📜 版本更新紀錄 (Changelog)

### V3.0.0 - 通知與管理控制 (Current)
* **核心功能:** 引入強大的管理指令，實現監控的高度彈性配置。
* **指令新增:** 實作 `/ossc set-interval`, `/ossc notify-role`, `/ossc toggle-monitoring`, `/ossc force-reset`。
* **架構優化:** 監控循環 (`setInterval`) 邏輯重構，可根據 `config.json` 動態調整間隔和啟停。
* **通知優化:** 狀態變更通知訊息可包含自定義角色標註 (`@Role`)。
* **部署優化:** 限制所有斜線指令僅部署於 `GUILD_ID` 環境變數指定的單一伺服器。

### V2.0.0 - 指令系統與動態配置
* **核心功能:** 實現 Slash Command 指令系統，允許在運行中動態更改監控網址。
* **指令新增:** 實作 `/ossc set-url`, `/ossc-history`, `/ossc-status`。
* **架構升級:** 引入 `data/config.json` 檔案進行持久化儲存。
* **部署需求:** 新增環境變數 `CLIENT_ID` 以註冊斜線指令。

### V1.1.0 - 抗洗版優化
* **功能新增:** 導入「防抖動 (Debounce)」邏輯，狀態須連續 3 次不變才發送通知。

---
*Powered by Node.js & Discord.js*