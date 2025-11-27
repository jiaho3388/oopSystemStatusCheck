const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// ==========================================
// Express 網頁伺服器設定 (這段不用動)
// ==========================================
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send('機器人正在運行中...'); });
app.listen(port, () => { console.log(`網頁伺服器已啟動，監聽 Port: ${port}`); });

// ==========================================
// 👇 設定區域 👇
// ==========================================
const TOKEN = process.env.DISCORD_TOKEN;
const WEBSITE_URL = 'https://oop.seilab.uk/'; // 你的網址
const CHANNEL_ID = '1441682465122025504'; // 記得確認你的頻道 ID 是否還在程式碼裡，如果是用環境變數就寫 process.env.CHANNEL_ID

// 🔥 修改 1: 設定檢查頻率和確認次數
const CHECK_INTERVAL = 10000; // 10秒檢查一次
const CONFIRM_THRESHOLD = 3;  // 🔥 累積 3 次才發送通知

// ==========================================

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 🔥 修改 2: 新增一個計數器變數
let lastConfirmedStatus = null; // 上一次「已確認發送通知」的狀態
let changeCounter = 0;          // 用來計算連續次數的計數器

async function checkWebsite() {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return;

    let currentCheckResult = false; // 這次檢查的結果 (預設 false)

    try {
        // 加上 User-Agent 偽裝
        const response = await axios.get(WEBSITE_URL, { 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        
        if (response.status >= 200 && response.status < 300) {
            currentCheckResult = true; // 活著
        }
    } catch (error) {
        currentCheckResult = false; // 掛了
        // console.log(`檢查失敗: ${error.message}`); // 想看 log 可以打開
    }

    // ==========================================
    // 🔥 修改 3: 防抖動邏輯 (核心修改)
    // ==========================================

    // 剛啟動時的初始化
    if (lastConfirmedStatus === null) {
        lastConfirmedStatus = currentCheckResult;
        console.log(`[初始化] 目前狀態: ${currentCheckResult ? '🟢' : '🔴'}`);
        return;
    }

    // 情況 A: 這次檢查結果 跟 上次確認的狀態「不一樣」
    if (currentCheckResult !== lastConfirmedStatus) {
        changeCounter++; // 計數器 +1
        console.log(`⚠️ 狀態不穩或改變中... 累積次數: ${changeCounter}/${CONFIRM_THRESHOLD} (目前偵測: ${currentCheckResult ? '🟢' : '🔴'})`);

        // 如果累積次數達到門檻 (例如 3 次)
        if (changeCounter >= CONFIRM_THRESHOLD) {
            // 真的改變了！發送通知
            if (currentCheckResult === true) {
                await channel.send(`🟢 **服務恢復通知**\n網站 **${WEBSITE_URL}** 已經恢復連線！`);
            } else {
                await channel.send(`🔴 **服務中斷警報**\n網站 **${WEBSITE_URL}** 目前無法連線 (已確認 ${CONFIRM_THRESHOLD} 次)。`);
            }

            // 更新「已確認狀態」並歸零計數器
            lastConfirmedStatus = currentCheckResult;
            changeCounter = 0;
            console.log(`✅ 狀態已確認更新為: ${lastConfirmedStatus ? '🟢' : '🔴'}`);
        }
    } 
    // 情況 B: 這次檢查結果 跟 上次確認的狀態「一樣」
    else {
        // 如果中間有偶發的失敗，但現在又正常了，就把計數器歸零 (重置)
        if (changeCounter > 0) {
            console.log(`😌 狀態恢復穩定，計數器歸零。`);
            changeCounter = 0;
        }
    }
}

client.once('ready', () => {
    console.log(`登入成功！ ${client.user.tag}`);
    checkWebsite();
    setInterval(checkWebsite, CHECK_INTERVAL);
});

client.login(TOKEN);