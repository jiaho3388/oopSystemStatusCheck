# 💻 網站狀態檢查 Discord 機器人 (OOP System Status Check Bot)

![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)
![Status](https://img.shields.io/badge/Status-Active-success.svg)

這是一個專為監控網站連線狀態而設計的 Discord 機器人專案。它具備高可靠性的後台服務，能夠即時偵測目標網站的連線狀況，並在發生異常或恢復連線時，透過 Discord 頻道發送即時通知。

適用於學校伺服器、個人專案或任何需要 24/7 連線監控的場景。

## ✨ V3.0.0 核心功能

### 🚀 高效監控與管理
* **動態指令控制:** 透過 Slash Commands (`/`) 即可在 Discord 內即時切換監控網址、調整檢查頻率。
* **抗洗版機制 (Debounce):** 內建智慧判斷邏輯，狀態須連續確認 3 次才發送通知，有效過濾網路瞬斷造成的假警報。
* **持久化配置:** 系統設定自動儲存，即使服務重啟或更新，監控目標與歷史紀錄也不會遺失。

### 🔔 彈性通知系統
* **角色標註:** 可設定當服務中斷時，自動 Tag 特定管理員角色 (`@Role`)。
* **即時狀態查詢:** 隨時透過指令查詢當前網站的 HTTP 狀態碼與回應時間。

---

## 🛠️ 部署與設置指南

本專案設計為部署於 **Render**、**Heroku** 或 **VPS** 等支援 Node.js 的環境。

### 1. 必要環境變數 (Environment Variables)

⚠️ **資安注意：** 以下變數包含敏感資訊，請務必直接設定於雲端平台的 Environment Variables 區塊中，**切勿**將真實數值寫入公開的程式碼或 commit 到 GitHub。

| 變數名稱 (Key) | 描述 |
| :--- | :--- |
| `DISCORD_TOKEN` | 機器人的存取權杖 (Bot Token)。 |
| `CLIENT_ID` | 應用程式 ID (Application ID)，用於註冊斜線指令。 |
| `GUILD_ID` | 指定部署指令的伺服器 ID (Guild ID)，確保指令安全性。 |

### 2. 專案配置 (`data/config.json`)

系統運行時會自動讀取此設定檔。初次部署時請確保 `data` 資料夾內包含 `config.json`。

---

## 🕹️ 指令列表 (Slash Commands)

為確保安全性，所有管理指令預設限制具有「管理伺服器」權限的成員使用。

| 指令 | 功能說明 |
| :--- | :--- |
| `/ossc set-url` | 切換監控目標網址。 |
| `/ossc set-interval` | 調整檢查頻率 (秒)。 |
| `/ossc notify-role` | 設定警報時要通知的角色。 |
| `/ossc toggle-monitoring`| 暫停/啟動監控循環。 |
| `/ossc force-reset` | 強制重置狀態判斷邏輯。 |
| `/ossc-status` | 顯示當前即時狀態。 |

---

## 關於專案與開發

此網站狀態監控系統由 **海浪** 主導開發與維護。

本專案在架構設計與程式實作過程中，採用 **Gemini [Flash 2.5]** 作為技術輔助工具，旨在結合現代化 AI 技術提升開發效率，建構一套穩定且易於擴充的自動化解決方案。

---
*Powered by Node.js & Discord.js*