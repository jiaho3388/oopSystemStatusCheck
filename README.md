# 💻 網站狀態檢查 Discord 機器人 (OOP System Status Check Discord Bot)

這個專案是一個基於 Node.js 和 Discord.js 的後台服務，專門用來監控指定網站的連線狀態。當網站狀態發生改變時，它會自動在 Discord 頻道發送通知。

## ✨ V3.0.0 專案核心特色

* **通知彈性 (NEW!):** 可動態設定狀態變更時要標註 (Mention) 的角色。
* **精準管理 (NEW!):** 可動態調整檢查頻率、暫停/啟動監控，並強制重置狀態。
* **指令控制:** 使用 Slash Command，可動態更改監控網址。
* **持久化儲存:** 使用 `config.json` 儲存所有動態設定，重啟不丟失。
* **抗洗版機制:** 狀態必須連續 3 次保持不變，才會發送通知。

## ⚙️ 專案配置與部署

### 1. 檔案配置 (`data/config.json`)

此檔案儲存了機器人在運行中會變動的核心設定。

| JSON Key | 說明 | 預設值 |
| :--- | :--- | :--- |
| `current_url` | 當前機器人正在監控的網站 URL。 | `string` |
| `url_history` | 曾監控過的網址列表。 | `array` |
| `command_channel_id` | 專門用來接收指令和發送通知的頻道 ID。 | `string` |
| `notification_role_id` | **(NEW!)** 狀態變更時要標註的角色 ID。 | `null` |
| `check_interval` | **(NEW!)** 網站檢查頻率 (單位：毫秒)。 | `10000` |
| `monitoring_enabled` | **(NEW!)** 監控總開關 (`true` 或 `false`)。 | `true` |

### 2. 環境變數 (Environment Variables)

請在 Render 的 **Environment** 區塊中設定以下機密變數：

| 環境變數名稱 | 說明 | 來源 |
| :--- | :--- | :--- |
| `DISCORD_TOKEN` | 你的 Discord 機器人 Token。 | Discord Developer Portal > Bot |
| `CLIENT_ID` | 機器人的應用程式 ID，用於註冊斜線指令。 | Discord Developer Portal > General Information |
| `GUILD_ID` | **(NEW!)** 唯一的目標伺服器 ID，指令將只會部署在這個伺服器上。 | 伺服器設定 (開發者模式複製 ID) |

## 🕹️ 機器人指令系統 (Slash Commands)

所有指令都限制給**伺服器管理員**使用，並必須在 `command_channel_id` 所指定的頻道中操作。

| 指令格式 | 說明 |
| :--- | :--- |
| `/ossc set-url <url>` | **動態切換**監控的網站 URL。 |
| `/ossc set-interval <seconds>` | **(NEW!)** 更改網站檢查頻率 (最少 5 秒)。 |
| `/ossc notify-role <role>` | **(NEW!)** 設定狀態變更時要標註的角色 (不填角色則清除)。 |
| `/ossc toggle-monitoring` | **(NEW!)** 暫停或啟動網站監控循環 (Bot 保持運行)。 |
| `/ossc force-reset` | **(NEW!)** 強制重置 Debounce 計數器，清除上次狀態並立即重新檢查。 |
| `/ossc-history` | 顯示所有曾經設定過的監控網址歷史紀錄。 |
| `/ossc-status` | 立即檢查當前監控網站的狀態。 |

---
## 關於專案與開發

此網站狀態監控系統專案由 **海浪** 主導開發，旨在建構一套自主運行、具備高可靠性的 Discord 通知解決方案。

本專案於設計與實作過程中，部分藉助 **Gemini [Flash 2.5]** 作為智慧輔助工具，以確保程式碼架構的現代化、專業性及快速迭代能力。

---
*Powered by Node.js & Discord.js*