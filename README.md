# 💻 網站狀態檢查 Discord 機器人 (OOP System Status Check Bot)

![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)
![Status](https://img.shields.io/badge/Status-Active-success.svg)

這是一個專為監控網站連線狀態而設計的 Discord 機器人專案。它具備高可靠性的後台服務，能夠即時偵測目標網站的連線狀況，並在發生異常或恢復連線時，透過 Discord 頻道發送即時通知。

## ✨ V3.2.0 最新版特色

### 📢 頻道分流 (New!)
* **指令與通知分離:** 實現「管理」與「通知」的頻道分離。管理員可在專屬指令頻道操作，而狀態通知則發送至公開/唯讀頻道，保持版面整潔。

### 🚀 高效與穩定
* **記憶體優化 (Slim Mode):** 針對 Render 免費版環境最佳化，限制 Discord.js 快取策略，大幅降低記憶體佔用，預防 OOM。
* **異常回報黑盒子:** 當系統發生未預期崩潰 (Crash) 時，會嘗試將錯誤訊息發送至指令頻道，方便排查問題。

### 🛠️ 監控與管理
* **動態指令控制:** 支援 `/ossc` 斜線指令，隨時切換監控網址、調整頻率。
* **抗洗版機制 (Debounce):** 狀態須連續確認 3 次才發送通知。
* **持久化配置:** 設定檔自動儲存，重啟不丟失。
* **彈性通知:** 支援角色標註 (`@Role`) 功能。

---

## 🛠️ 部署與設置指南

### 1. 必要環境變數 (Environment Variables)

⚠️ **資安注意：** 請於雲端平台 (Render) 後台設定以下變數，切勿寫死在程式碼中。

| 變數名稱 | 描述 |
| :--- | :--- |
| `DISCORD_TOKEN` | 機器人的存取權杖 (Bot Token)。 |
| `CLIENT_ID` | 應用程式 ID，用於註冊斜線指令。 |
| `GUILD_ID` | 指定部署指令的伺服器 ID (Guild ID)。 |

### 2. 專案配置 (`data/config.json`)

初次部署請確保 `data` 資料夾內包含 `config.json`，系統會自動讀寫此檔案。

| JSON Key | 說明 |
| :--- | :--- |
| `current_url` | 當前機器人正在監控的網站 URL。 |
| `url_history` | 曾監控過的網址列表。 |
| `command_channel_id` | **指令專用：** 管理員下達 Slash Command 的頻道 ID。 |
| `notify_channel_id` | **通知專用 (New)：** 機器人發送狀態變更通知的頻道 ID。 |
| `notification_role_id` | 狀態變更時要標註的角色 ID。 |
| `check_interval` | 網站檢查頻率 (單位：毫秒)。 |
| `monitoring_enabled` | 監控總開關 (`true` 或 `false`)。 |

---

## 🕹️ 指令列表 (Slash Commands)

限制具有「管理伺服器」權限的成員使用，且僅能在 `command_channel_id` 指定的頻道操作。

| 指令 | 功能說明 |
| :--- | :--- |
| `/ossc set-url` | 切換監控目標網址。 |
| `/ossc set-interval` | 調整檢查頻率 (秒)。 |
| `/ossc notify-role` | 設定警報通知角色。 |
| `/ossc toggle-monitoring`| 暫停/啟動監控。 |
| `/ossc force-reset` | 強制重置狀態。 |
| `/ossc-status` | 顯示即時狀態。 |

---

## 關於專案與開發

此網站狀態監控系統由 **海浪** 主導開發與維護。

本專案在架構設計與程式實作過程中，採用 **Gemini [ 3 pro ]** 作為技術輔助工具，旨在結合現代化 AI 技術提升開發效率，建構一套穩定且易於擴充的自動化解決方案。

---
*Powered by Node.js & Discord.js*