// 引入需要的套件
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('機器人正在運行中...');
});

app.listen(port, () => {
  console.log(`網頁伺服器已啟動，監聽 Port: ${port}`);
});
// ==========================================
// 👇 請在下方填入你的資料 👇
// ==========================================

// 1. 你的 Discord 機器人 Token (請妥善保管，不要外流)
const TOKEN = process.env.DISCORD_TOKEN;

// 2. 你要監控的網站網址
const WEBSITE_URL = 'https://oop.seilab.uk/'; // 測試用，之後可以換成你的網站

// 3. 你要發送通知的頻道 ID (右鍵頻道 -> 複製 ID)
const CHANNEL_ID = '1441682465122025504';

// 4. 檢查頻率 (毫秒) - 這裡設為 10 秒檢查一次方便你測試，之後可以改 300000 (5分鐘)
const CHECK_INTERVAL = 10000; 

// ==========================================
// 👆 設定結束 👆
// ==========================================

// 初始化機器人
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] // 只需要最基本的權限
});

// 變數：用來記錄「上一次」的狀態
// null = 剛啟動，還不知道狀態
// true = 網站活著 (Online)
// false = 網站掛了 (Offline)
let lastStatus = null;

// 核心功能：檢查網站狀態
async function checkWebsite() {
    // 取得目標頻道
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.log("找不到頻道！請確認 CHANNEL_ID 是否正確，且機器人已加入該伺服器。");
        return;
    }

    let currentStatus = false; // 暫定當前狀態是死的

    try {
        // 嘗試連線網站 (設定 5 秒超時)
        const response = await axios.get(WEBSITE_URL, { timeout: 5000 });
        
        // 如果狀態碼是 200~299，代表活著
        if (response.status >= 200 && response.status < 300) {
            currentStatus = true;
        }
    } catch (error) {
        // 連線失敗 (超時、網址錯誤、伺服器掛掉)
        currentStatus = false;
        console.log(`檢查失敗: ${error.message}`);
    }

    // ==========================================
    // 邏輯判斷：只有狀態「改變」時才說話
    // ==========================================
    
    // 如果是機器人剛啟動第一次檢查
    if (lastStatus === null) {
        lastStatus = currentStatus;
        console.log(`[初始化] 機器人啟動，目前網站狀態: ${currentStatus ? '🟢 正常' : '🔴 異常'}`);
        // 第一次通常不發通知，避免重啟機器人時一直洗版，
        // 如果你想第一次也通知，可以在這裡加 code。
        return;
    }

    // 如果狀態真的改變了 (例如從 true 變 false，或 false 變 true)
    if (currentStatus !== lastStatus) {
        
        if (currentStatus === true) {
            // 💀 -> 🟢 復活了
            await channel.send(`🟢 **服務恢復通知**\n網站 **${WEBSITE_URL}** 已經恢復連線！`);
            console.log("狀態變更：網站恢復連線");
        } else {
            // 🟢 -> 💀 掛掉了
            await channel.send(`🔴 **服務中斷警報**\n網站 **${WEBSITE_URL}** 目前無法連線，請檢查伺服器狀態。`);
            console.log("狀態變更：網站連線失敗");
        }

        // 更新記憶中的狀態，等待下一次改變
        lastStatus = currentStatus;
    } else {
        // 狀態沒變，安靜地在後台 log 一下就好
        console.log(`狀態未變 (${currentStatus ? '正常' : '異常'})，保持安靜...`);
    }
}

// 當機器人準備好時觸發
client.once('ready', () => {
    console.log(`登入成功！機器人身分: ${client.user.tag}`);
    
    // 1. 立刻檢查一次
    checkWebsite();

    // 2. 設定定時器，每隔一段時間檢查一次
    setInterval(checkWebsite, CHECK_INTERVAL);
});

// 登入機器人
client.login(TOKEN);