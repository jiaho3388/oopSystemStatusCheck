# 版本更新紀錄 (Changelog)

### V3.2.0 - 頻道分流管理 (Current)
* **核心功能:** 實現指令頻道 (`command_channel_id`) 與通知頻道 (`notify_channel_id`) 的分離。
* **優化:** 管理員可在後台頻道操作指令，而狀態警報則發送至公開頻道，提升閱讀體驗。
* **修正:** 移除 V3.1.0 的自動重啟機制，避免因正常關閉而觸發 Render/UptimeRobot 的假警報。

### V3.1.0 - 穩定性與效能優化
* **效能優化:** 實作 Discord.js `makeCache` 選項，移除不必要的訊息與使用者快取，降低 RAM 使用率。
* **除錯功能:** 增加 Global Error Handler (黑盒子)，攔截未捕獲的異常並回報至 Discord。

### V3.0.0 - 通知與管理控制
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