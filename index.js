// 🔥 引入 Node.js 內建模組
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const axios = require('axios');
const express = require('express');

// ==========================================
// Express 網頁伺服器設定 (常駐服務用)
// ==========================================
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send('機器人正在運行中...'); });
app.listen(port, () => { console.log(`網頁伺服器已啟動，監聽 Port: ${port}`); });

// ==========================================
// 🔥 核心配置與檔案系統
// ==========================================
// 設定檔案路徑：指向 data/config.json
const CONFIG_PATH = path.resolve(__dirname, 'data', 'config.json');

// 檢查間隔、防抖動設定（保持不變）
const CHECK_INTERVAL = 10000; // 10秒檢查一次
const CONFIRM_THRESHOLD = 3;  // 累積 3 次才發送通知

// 環境變數
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // 🔥 新增：部署指令需要 Bot 的 Client ID

// 狀態變數 (保持不變)
let lastConfirmedStatus = null; 
let changeCounter = 0;          

/**
 * 🔥 讀取配置檔 (config.json)
 * @returns {object} 配置物件
 */
function getConfig() {
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('讀取配置檔失敗:', error);
        return null;
    }
}

/**
 * 🔥 寫入配置檔 (config.json)
 * @param {object} newConfig 要寫入的新配置
 * @returns {boolean} 是否寫入成功
 */
function saveConfig(newConfig) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('寫入配置檔失敗:', error);
        return false;
    }
}

// ==========================================
// 🔥 網站狀態檢查函式 (使用動態 URL)
// ==========================================
async function checkWebsite() {
    const config = getConfig();
    if (!config) return;

    const WEBSITE_URL = config.current_url; // 🔥 從配置檔讀取 URL
    const NOTIFY_CHANNEL_ID = config.command_channel_id; // 🔥 從配置檔讀取頻道 ID

    if (!WEBSITE_URL || !NOTIFY_CHANNEL_ID) {
        console.log("配置檔缺少 WEBSITE_URL 或 CHANNEL_ID，跳過檢查。");
        return;
    }

    const channel = client.channels.cache.get(NOTIFY_CHANNEL_ID);
    if (!channel) return;

    let currentCheckResult = false; 

    try {
        const response = await axios.get(WEBSITE_URL, { 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        
        if (response.status >= 200 && response.status < 300) {
            currentCheckResult = true; 
        }
    } catch (error) {
        currentCheckResult = false; 
    }

    // --- 防抖動邏輯 (保持不變) ---
    if (lastConfirmedStatus === null) {
        lastConfirmedStatus = currentCheckResult;
        console.log(`[初始化] 目前狀態: ${currentCheckResult ? '🟢' : '🔴'} (${WEBSITE_URL})`);
        return;
    }

    if (currentCheckResult !== lastConfirmedStatus) {
        changeCounter++; 
        console.log(`⚠️ 狀態不穩或改變中... 累積次數: ${changeCounter}/${CONFIRM_THRESHOLD} (目前偵測: ${currentCheckResult ? '🟢' : '🔴'})`);

        if (changeCounter >= CONFIRM_THRESHOLD) {
            if (currentCheckResult === true) {
                await channel.send(`🟢 **服務恢復通知**\n網站 **${WEBSITE_URL}** 已經恢復連線！`);
            } else {
                await channel.send(`🔴 **服務中斷警報**\n網站 **${WEBSITE_URL}** 目前無法連線 (已確認 ${CONFIRM_THRESHOLD} 次)。`);
            }
            lastConfirmedStatus = currentCheckResult;
            changeCounter = 0;
            console.log(`✅ 狀態已確認更新為: ${lastConfirmedStatus ? '🟢' : '🔴'}`);
        }
    } else {
        if (changeCounter > 0) {
            console.log(`😌 狀態恢復穩定，計數器歸零。`);
            changeCounter = 0;
        }
    }
}

// ==========================================
// 🔥 Discord 指令定義
// ==========================================
const commands = [
    // /ossc set-url [新網址]
    new SlashCommandBuilder()
        .setName('ossc')
        .setDescription('網站狀態檢查 Bot 的核心指令')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-url')
                .setDescription('設定要監控的新網站 URL')
                .addStringOption(option => 
                    option.setName('url')
                        .setDescription('新的網站 URL (必須包含 https://)')
                        .setRequired(true))),

    // /ossc history
    new SlashCommandBuilder()
        .setName('ossc-history')
        .setDescription('顯示曾經使用過的監控網址清單'),

    // /ossc status
    new SlashCommandBuilder()
        .setName('ossc-status')
        .setDescription('立即檢查當前監控網站的狀態'),
].map(command => command.toJSON());

// ==========================================
// 🔥 Discord 客戶端與事件處理
// ==========================================

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

// 處理 Slash Command 互動
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    let config = getConfig();

    // 檢查是否在指令頻道
    if (config && interaction.channelId !== config.command_channel_id) {
        await interaction.reply({ content: `❌ 請到指定的指令頻道 <#${config.command_channel_id}> 使用本指令。`, ephemeral: true });
        return;
    }

    if (commandName === 'ossc') {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'set-url') {
            const newUrl = interaction.options.getString('url');

            // 1. 驗證 URL
            if (!newUrl.startsWith('http')) {
                 await interaction.reply({ content: '❌ URL 格式錯誤，請確保以 `http://` 或 `https://` 開頭。', ephemeral: true });
                 return;
            }

            // 2. 執行切換邏輯
            if (config.current_url && config.current_url !== newUrl) {
                // 將舊網址存入歷史紀錄
                if (!config.url_history.includes(config.current_url)) {
                    config.url_history.push(config.current_url);
                }
            }
            
            config.current_url = newUrl;
            
            // 3. 儲存配置
            if (saveConfig(config)) {
                // 重置狀態檢查變數
                lastConfirmedStatus = null; 
                changeCounter = 0;          
                
                await interaction.reply({ content: `✅ **新監控網址設定成功！**\n已將監控目標切換為：\`${newUrl}\`。\n系統已重置，將在下次檢查時啟動新網址的監控。`, ephemeral: false });
            } else {
                await interaction.reply({ content: '❌ 儲存配置失敗，請檢查檔案權限。', ephemeral: true });
            }
        }
    } 
    // 處理 /ossc-history
    else if (commandName === 'ossc-history') {
        if (config.url_history.length === 0) {
            await interaction.reply({ content: '歷史紀錄中目前沒有其他曾監控的網址。', ephemeral: true });
            return;
        }

        const historyList = config.url_history.map((url, index) => 
            `\`${index + 1}\`. ${url}`
        ).join('\n');

        await interaction.reply({ content: `📜 **曾監控網址歷史紀錄：**\n\n${historyList}`, ephemeral: true });
    }
    // 處理 /ossc-status
    else if (commandName === 'ossc-status') {
        await interaction.deferReply(); // 告訴 Discord 正在處理中

        try {
            const url = config.current_url;
            const response = await axios.get(url, { 
                timeout: 5000,
                headers: { 'User-Agent': 'Discord Bot Status Check' } 
            });

            if (response.status >= 200 && response.status < 300) {
                await interaction.editReply(`🟢 網站 **${url}** 狀態正常。\nHTTP Code: \`${response.status}\``);
            } else {
                await interaction.editReply(`⚠️ 網站 **${url}** 回應異常。\nHTTP Code: \`${response.status}\``);
            }
        } catch (error) {
            await interaction.editReply(`🔴 網站檢查失敗，可能已中斷連線。\n錯誤訊息: \`${error.message}\``);
        }
    }
});


// 機器人啟動時的事件
client.once('ready', () => {
    console.log(`登入成功！ ${client.user.tag}`);
    
    // 啟動網站狀態檢查循環
    checkWebsite();
    setInterval(checkWebsite, CHECK_INTERVAL);

    // 🔥 註冊 Slash Commands
    registerSlashCommands();
});

/**
 * 🔥 註冊斜線指令到 Discord 伺服器 (只需要執行一次)
 */
function registerSlashCommands() {
    const CLIENT_ID = process.env.CLIENT_ID; // 確保你有設定這個環境變數

    if (!CLIENT_ID || !DISCORD_TOKEN) {
        console.error('❌ 無法註冊指令：請設定環境變數 CLIENT_ID 和 DISCORD_TOKEN。');
        return;
    }
    
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    
    // 這裡使用 Guilds API 註冊指令，只會在你的伺服器出現
    // 為了簡單起見，我們將指令註冊到所有機器人所在的伺服器 (這假設 Bot 只在一個伺服器)
    client.guilds.cache.forEach(async guild => {
        try {
            console.log(`嘗試在伺服器 ${guild.name} 註冊指令...`);
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, guild.id),
                { body: commands },
            );
            console.log(`✅ 伺服器 ${guild.name} 指令註冊完成！`);
        } catch (error) {
            console.error(`❌ 伺服器 ${guild.name} 指令註冊失敗:`, error);
        }
    });
}

client.login(DISCORD_TOKEN);