// 🔥 引入 Node.js 內建模組
const fs = require('fs');
const path = require('path');
const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    Routes, 
    PermissionFlagsBits 
} = require('discord.js');
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
// 🔥 核心配置與狀態追蹤
// ==========================================
const CONFIG_PATH = path.resolve(__dirname, 'data', 'config.json');
const CONFIRM_THRESHOLD = 3;  // 累積 3 次才發送通知 (防抖動門檻)

// 環境變數
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; 
const GUILD_ID = process.env.GUILD_ID; // V2.0.0 新增：目標伺服器 ID

// 狀態變數
let lastConfirmedStatus = null; 
let changeCounter = 0;          
let checkIntervalRef = null; // 用來儲存 setInterval 的引用，以便動態調整或停止

/**
 * 讀取配置檔 (config.json)
 */
function getConfig() {
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('讀取配置檔失敗，請檢查 data/config.json:', error);
        return null;
    }
}

/**
 * 寫入配置檔 (config.json)
 */
function saveConfig(newConfig) {
    try {
        // 使用 null, 2 格式化 JSON，使其易讀
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('寫入配置檔失敗:', error);
        return false;
    }
}

// ==========================================
// 🔥 V3.0.0 監控核心
// ==========================================

/**
 * 啟動或重啟監控循環 (用於動態調整間隔或啟動/暫停)
 */
function startMonitoringLoop() {
    if (checkIntervalRef) {
        clearInterval(checkIntervalRef); // 清除任何現有的定時器
    }
    
    const config = getConfig();
    const DEFAULT_INTERVAL = 10000;

    if (!config || !config.monitoring_enabled) {
        console.log('監控已暫停或配置讀取失敗。');
        return;
    }

    const interval = config.check_interval || DEFAULT_INTERVAL;
    
    // 立即執行一次檢查
    checkWebsite();

    // 啟動新的定時器
    checkIntervalRef = setInterval(checkWebsite, interval);
    console.log(`[監控啟動] 檢查間隔設定為 ${interval / 1000} 秒。`);
}

/**
 * 網站狀態檢查函式
 */
async function checkWebsite() {
    const config = getConfig();
    if (!config || !config.monitoring_enabled) {
        return; // 監控已暫停
    }

    const WEBSITE_URL = config.current_url;
    const NOTIFY_CHANNEL_ID = config.command_channel_id;
    const NOTIFY_ROLE_ID = config.notification_role_id; // V3.0.0 通知角色 ID

    if (!WEBSITE_URL || !NOTIFY_CHANNEL_ID) {
        console.log("配置檔缺少 URL 或指令頻道 ID，跳過檢查。");
        return;
    }

    const channel = client.channels.cache.get(NOTIFY_CHANNEL_ID);
    if (!channel) return;

    let currentCheckResult = false; 

    try {
        // 發送帶有偽裝 User-Agent 的請求
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

    // --- 防抖動邏輯 ---
    if (lastConfirmedStatus === null) {
        lastConfirmedStatus = currentCheckResult;
        console.log(`[初始化] 目前狀態: ${currentCheckResult ? '🟢' : '🔴'} (${WEBSITE_URL})`);
        return;
    }

    if (currentCheckResult !== lastConfirmedStatus) {
        changeCounter++; 
        console.log(`⚠️ 狀態不穩或改變中... 累積次數: ${changeCounter}/${CONFIRM_THRESHOLD} (目前偵測: ${currentCheckResult ? '🟢' : '🔴'})`);

        if (changeCounter >= CONFIRM_THRESHOLD) {
            // 決定是否標註角色
            let mention = NOTIFY_ROLE_ID ? `<@&${NOTIFY_ROLE_ID}> ` : ''; 

            if (currentCheckResult === true) {
                await channel.send(`${mention} 🟢 **服務恢復通知**\n網站 **${WEBSITE_URL}** 已經恢復連線！`);
            } else {
                await channel.send(`${mention} 🔴 **服務中斷警報**\n網站 **${WEBSITE_URL}** 目前無法連線 (已確認 ${CONFIRM_THRESHOLD} 次)。`);
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
// 🔥 Discord 指令定義 (V3.0.0 整合所有指令)
// ==========================================
const commands = [
    new SlashCommandBuilder()
        .setName('ossc')
        .setDescription('網站狀態檢查 Bot 的核心指令')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) // 🔥 V3.0.0: 限制只有伺服器管理員可使用
        
        // V2.0.0: set-url
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-url')
                .setDescription('設定要監控的新網站 URL')
                .addStringOption(option => 
                    option.setName('url')
                        .setDescription('新的網站 URL (必須包含 http(s)://)')
                        .setRequired(true)))

        // V3.0.0: set-interval
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-interval')
                .setDescription('設定網站檢查頻率 (秒)')
                .addIntegerOption(option => 
                    option.setName('seconds')
                        .setDescription('檢查間隔時間，至少 5 秒')
                        .setRequired(true)))

        // V3.0.0: notify-role
        .addSubcommand(subcommand =>
            subcommand
                .setName('notify-role')
                .setDescription('設定狀態變動時要標註的角色 (留空則取消標註)')
                .addRoleOption(option => 
                    option.setName('role')
                        .setDescription('要標註的角色')
                        .setRequired(false)))
                        
        // V3.0.0: toggle-monitoring
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle-monitoring')
                .setDescription('開啟或關閉網站監控循環 (Bot 保持運行)'))
                
        // V3.0.0: force-reset
        .addSubcommand(subcommand =>
            subcommand
                .setName('force-reset')
                .setDescription('強制重置所有追蹤狀態 (Debounce) 並重新檢查')),

    // V2.0.0: history (獨立指令)
    new SlashCommandBuilder()
        .setName('ossc-history')
        .setDescription('顯示曾經使用過的監控網址清單')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // V2.0.0: status (獨立指令)
    new SlashCommandBuilder()
        .setName('ossc-status')
        .setDescription('立即檢查當前監控網站的狀態')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
        
].map(command => command.toJSON());

// ==========================================
// 🔥 Discord 客戶端與事件處理
// ==========================================

// V3.0.0 權限調整：需要 Guilds 來註冊指令，並需要 MessageContent 來避免某些互動問題
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

// 處理 Slash Command 互動
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    let config = getConfig();
    if (!config) {
        await interaction.reply({ content: '❌ 配置讀取失敗，請檢查 data/config.json 檔案。', ephemeral: true });
        return;
    }

    // 檢查是否在指令頻道 (V2.0.0 邏輯)
    if (interaction.channelId !== config.command_channel_id) {
        await interaction.reply({ content: `❌ 請到指定的指令頻道 <#${config.command_channel_id}> 使用本指令。`, ephemeral: true });
        return;
    }
    
    // --- 處理 /ossc 的子指令 ---
    if (commandName === 'ossc') {
        const subcommand = interaction.options.getSubcommand();
        
        // V2.0.0: set-url
        if (subcommand === 'set-url') {
            const newUrl = interaction.options.getString('url');
            if (!newUrl.startsWith('http')) {
                 await interaction.reply({ content: '❌ URL 格式錯誤，請確保以 `http://` 或 `https://` 開頭。', ephemeral: true });
                 return;
            }

            if (config.current_url && config.current_url !== newUrl) {
                if (!config.url_history.includes(config.current_url)) {
                    config.url_history.push(config.current_url);
                }
            }
            config.current_url = newUrl;
            
            if (saveConfig(config)) {
                // 重置狀態檢查變數
                lastConfirmedStatus = null; 
                changeCounter = 0;          
                
                await interaction.reply({ content: `✅ **新監控網址設定成功！**\n已將監控目標切換為：\`${newUrl}\`。\n系統已重置，將在下次檢查時啟動新網址的監控。`, ephemeral: false });
            } else {
                await interaction.reply({ content: '❌ 儲存配置失敗，請檢查檔案權限。', ephemeral: true });
            }
        } 
        
        // 🔥 V3.0.0: set-interval
        else if (subcommand === 'set-interval') {
            const seconds = interaction.options.getInteger('seconds');
            const minSeconds = 5;

            if (seconds < minSeconds) {
                await interaction.reply({ content: `❌ 檢查間隔至少要 ${minSeconds} 秒。`, ephemeral: true });
                return;
            }

            const intervalMs = seconds * 1000;
            config.check_interval = intervalMs;

            if (saveConfig(config)) {
                startMonitoringLoop(); // 重啟監控循環以使用新的間隔
                await interaction.reply({ content: `✅ **檢查間隔設定成功！**\n已更新為每 \`${seconds} 秒\` 檢查一次。`, ephemeral: false });
            } else {
                await interaction.reply({ content: '❌ 儲存配置失敗，請檢查檔案權限。', ephemeral: true });
            }
        }
        
        // 🔥 V3.0.0: notify-role
        else if (subcommand === 'notify-role') {
            const role = interaction.options.getRole('role');
            
            if (role) {
                config.notification_role_id = role.id;
                await interaction.reply({ content: `✅ **通知角色設定成功！**\n網站狀態變更時，將標註角色：<@&${role.id}>`, ephemeral: false });
            } else {
                // 如果沒有提供角色，則清除設定
                config.notification_role_id = null;
                await interaction.reply({ content: '✅ **通知角色已清除！**\n狀態變更時將不再標註任何角色。', ephemeral: false });
            }
            
            if (!saveConfig(config)) {
                await interaction.reply({ content: '❌ 儲存配置失敗，請檢查檔案權限。', ephemeral: true });
            }
        }
        
        // 🔥 V3.0.0: toggle-monitoring
        else if (subcommand === 'toggle-monitoring') {
            const isEnabled = !config.monitoring_enabled;
            config.monitoring_enabled = isEnabled;
            
            if (saveConfig(config)) {
                if (isEnabled) {
                    startMonitoringLoop(); // 啟動循環
                    await interaction.reply({ content: '✅ **網站監控已啟動！**', ephemeral: false });
                } else {
                    clearInterval(checkIntervalRef); // 停止循環
                    checkIntervalRef = null;
                    await interaction.reply({ content: '⏸️ **網站監控已暫停！** (Bot 仍在線，但停止檢查)', ephemeral: false });
                }
            } else {
                await interaction.reply({ content: '❌ 儲存配置失敗，請檢查檔案權限。', ephemeral: true });
            }
        }
        
        // 🔥 V3.0.0: force-reset
        else if (subcommand === 'force-reset') {
            lastConfirmedStatus = null;
            changeCounter = 0;
            
            // 重新啟動循環 (會立即觸發一次檢查)
            startMonitoringLoop();

            await interaction.reply({ content: '🔄 **狀態追蹤已強制重置！**\nDebounce 計數器歸零，將立即進行一次網站檢查。', ephemeral: false });
        }
    } 
    // --- 處理獨立指令 ---
    
    // V2.0.0: ossc-history
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
    
    // V2.0.0: ossc-status
    else if (commandName === 'ossc-status') {
        await interaction.deferReply(); // 告訴 Discord 正在處理中

        try {
            const url = config.current_url;
            const response = await axios.get(url, { 
                timeout: 5000,
                headers: { 'User-Agent': 'Discord Bot Status Check' } 
            });

            if (response.status >= 200 && response.status < 300) {
                await interaction.editReply(`🟢 網站 **${url}** 狀態正常。\nHTTP Code: \`${response.status}\`\n檢查間隔: \`${(config.check_interval || 10000) / 1000} 秒\``);
            } else {
                await interaction.editReply(`⚠️ 網站 **${url}** 回應異常。\nHTTP Code: \`${response.status}\`\n檢查間隔: \`${(config.check_interval || 10000) / 1000} 秒\``);
            }
        } catch (error) {
            await interaction.editReply(`🔴 網站檢查失敗，可能已中斷連線。\n錯誤訊息: \`${error.message}\`\n檢查間隔: \`${(config.check_interval || 10000) / 1000} 秒\``);
        }
    }
});


// 機器人啟動時的事件
client.once('ready', () => {
    console.log(`登入成功！ ${client.user.tag}`);
    
    // 啟動網站狀態檢查循環
    startMonitoringLoop(); 
    
    // 註冊 Slash Commands
    registerSlashCommands();
});

// 註冊斜線指令到單一目標伺服器 (V2.0.0 Fix)
function registerSlashCommands() {
    const CLIENT_ID = process.env.CLIENT_ID;
    const GUILD_ID = process.env.GUILD_ID; 

    if (!CLIENT_ID || !DISCORD_TOKEN || !GUILD_ID) {
        console.error('❌ 無法註冊指令：請設定 CLIENT_ID, DISCORD_TOKEN, 和 GUILD_ID。');
        return;
    }
    
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    
    rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands },
    )
    .then(() => console.log(`✅ 成功在目標伺服器 ${GUILD_ID} 註冊指令！`))
    .catch(error => console.error(`❌ 指令註冊失敗:`, error));
}

client.login(DISCORD_TOKEN);