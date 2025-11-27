# 💻 網站狀態檢查 Discord 機器人 (OOP System Status Check Discord Bot)

這個專案是一個基於 Node.js 和 Discord.js 的後台服務，專門用來監控指定網站的連線狀態。當網站狀態發生改變時，它會自動在 Discord 頻道發送通知。

## ✨ V2.0.0 專案核心特色

* **指令控制 (NEW!):** 首次引入 Slash Command 指令系統，可動態更改監控網址。
* **持久化儲存 (NEW!):** 使用 `config.json` 儲存監控目標和歷史紀錄，重啟不丟失設定。
* **抗洗版機制:** 狀態必須連續 3 次保持不變，才會發送通知。
* **常駐運行:** 部署在 Render (Web Service Free Tier)，並搭配外部服務確保 24/7 不休眠運行。

## ⚙️ 專案配置與部署

### 1. 檔案配置 (`data/config.json`)

此檔案儲存了機器人在運行中會變動的核心設定。請確保此檔案已存在於 `data` 資料夾中。

| JSON Key | 說明 | 範例值 |
| :--- | :--- | :--- |
| `current_url` | 當前機器人正在監控的網站 URL。 | `"https://oop.seilab.uk/"` |
| `url_history` | 曾監控過的網址列表。 | `[]` |
| `command_channel_id` | 專門用來接收 `/ossc` 指令的 Discord 頻道 ID。 | `"123456789012345678"` |

### 2. 環境變數 (Environment Variables)

請在 Render 的 **Environment** 區塊中設定以下機密變數：

| 環境變數名稱 | 說明 | 來源 |
| :--- | :--- | :--- |
| `DISCORD_TOKEN` | 你的 Discord 機器人 Token。 | Discord Developer Portal > Bot |
| `CLIENT_ID` | **(NEW!)** 機器人的應用程式 ID，用於註冊斜線指令。 | Discord Developer Portal > General Information |
| `PORT` | 伺服器監聽的 Port (建議由 Render 自動設定)。 | - |

## 🕹️ 機器人指令系統 (Slash Commands)

請在指定的指令頻道中輸入以下指令：

| 指令格式 | 說明 |
| :--- | :--- |
| `/ossc set-url <url>` | **動態切換**監控的網站 URL，並自動重置狀態檢查。 |
| `/ossc-history` | 顯示所有曾經設定過的監控網址歷史紀錄。 |
| `/ossc-status` | 立即執行一次網站檢查，回傳當前監控目標的即時狀態。 |

---
*Powered by Node.js & Discord.js*