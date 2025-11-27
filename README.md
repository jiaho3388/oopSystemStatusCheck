# 💻 網站狀態檢查 Discord 機器人 (OOP System Status Check Discord Bot)

這個專案是一個基於 Node.js 和 Discord.js 的後台服務，專門用來監控指定網站的連線狀態（例如學校的伺服器）。當網站狀態發生改變（從正常變為異常，或從異常恢復正常）時，它會立即在 Discord 頻道發送通知。

## ✨ 專案特色

* **即時監控:** 每 10 秒檢查一次目標網站狀態。
* **抗洗版機制 (Debounce):** 狀態必須**連續 3 次**保持不變，才會發送通知，有效過濾網路瞬斷造成的假警報。
* **常駐運行:** 部署在 Render 平台上，並使用外部服務確保 24/7 不休眠運行。
* **自動部署:** 連動 GitHub，程式碼一更新就會自動重新部署。

## ⚙️ 系統設定

### 1. 核心檔案設定 (`index.js`)

在開始部署前，請確保以下變數已在 `index.js` 中正確設定：

| 變數名稱 | 說明 |
| :--- | :--- |
| `WEBSITE_URL` | 你要監控的目標網站 URL。 |
| `CHANNEL_ID` | Discord 通知發送的頻道 ID。 |
| `CHECK_INTERVAL` | 網站檢查頻率 (單位：毫秒，預設 10000ms = 10 秒)。 |
| `CONFIRM_THRESHOLD` | 防抖動門檻，狀態須連續變動此次數才發送通知 (預設 3 次)。 |

### 2. 環境變數 (Environment Variables)

這個專案依賴於環境變數來安全地儲存敏感資訊，請在 Render 或其他部署平台上設定以下變數：

| 環境變數名稱 | 說明 |
| :--- | :--- |
| `DISCORD_TOKEN` | 你的 Discord 機器人 Token。 |
| `PORT` | 伺服器監聽的 Port (建議設定為 3000 或由 Render/Heroku 等平台自動設定)。 |

---
*Powered by Node.js & Discord.js*