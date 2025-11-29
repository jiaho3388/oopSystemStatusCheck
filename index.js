// 🔥 引入 Node.js 內建模組
const fs = require('fs');
const path = require('path');
const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    Routes, 
    PermissionFlagsBits,
    Options // V3.1.0: 引入 Options 用於記憶體優化
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const axios = require('axios');
const express = require('express');

// ==========================================
// Express 網頁伺服器 (常駐與 UptimeRobot 用)
// ==========================================
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send('機器人正在運行中... (V3.1.0 Stable)'); });
app.listen(port, () => { console.log(`網頁伺服器已啟動，監聽 Port: ${port}`); });

// ==========================================
// 核心配置
// ==========================================
const CONFIG_PATH = path.resolve(__dirname, 'data', 'config.json');
const CONFIRM_THRESHOLD = 3;  

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; 
const GUILD_ID = process.env.GUILD_ID;

let lastConfirmedStatus = null; 
let changeCounter = 0;          
let checkIntervalRef = null;

// ==========================================
// 配置檔讀寫
// ==========================================
function getConfig() {
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('讀取配置檔失敗:', error);
        return null;
    }
}

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
// V3.1.0: 黑盒子錯誤回報機制
// ==========================================
async function sendErrorLog(errorType, error) {
    console.error(`[${errorType}]`, error); 
    try {
        const config = getConfig();
        if (config && config.command_channel_id) {
            const channel = client.channels.cache.get(config.command_channel_id);
            if (channel) {
                await channel.send(`🚨 **系統異常警報 (Crash Report)**\n類型: \`${errorType}\`\n訊息: \`\`\`${error.stack || error}\`\`\`\n*系統將嘗試維持運作或自動重啟...*`);
            }
        }
    } catch (e) { console.error('無法發送錯誤日誌:', e); }
}

process.on('uncaughtException', async (error) => {
    await sendErrorLog('Uncaught Exception', error);
    process.exit(1); // 遇到嚴重錯誤退出，讓 Render 重啟
});

process.on('unhandledRejection', async (reason) => {
    await sendErrorLog('Unhandled Rejection', reason);
});

// ==========================================
// 監控邏輯
// ==========================================
function startMonitoringLoop() {
    if (checkIntervalRef) clearInterval(checkIntervalRef);
    
    const config = getConfig();
    const DEFAULT_INTERVAL = 10000;

    if (!config || !config.monitoring_enabled) {
        console.log('監控已暫停。');
        return;
    }

    const interval = config.check_interval || DEFAULT_INTERVAL;
    checkWebsite();
    checkIntervalRef = setInterval(checkWebsite, interval);
    console.log(`[監控啟動] 間隔: ${interval / 1000} 秒`);
}

async function checkWebsite() {
    const config = getConfig();
    if (!config || !config.monitoring_enabled) return;

    // 🔥 V3.2.0: 分離通知頻道 (讀取 notify_channel_id)
    // 如果沒設定 notify_channel_id，就暫時用 command_channel_id 頂替
    const NOTIFY_CHANNEL_ID = config.notify_channel_id || config.command_channel_id;
    
    const { current_url: WEBSITE_URL, notification_role_id: NOTIFY_ROLE_ID } = config;

    if (!WEBSITE_URL || !NOTIFY_CHANNEL_ID) return;
    
    // ... (下面的程式碼都不用動) ...

// ==========================================
// Discord 指令定義
// ==========================================
const commands = [
    new SlashCommandBuilder()
        .setName('ossc')
        .setDescription('網站狀態檢查 Bot 管理指令')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('set-url').setDescription('設定監控網址').addStringOption(o => o.setName('url').setDescription('URL').setRequired(true)))
        .addSubcommand(sub => sub.setName('set-interval').setDescription('設定檢查頻率(秒)').addIntegerOption(o => o.setName('seconds').setDescription('秒數').setRequired(true)))
        .addSubcommand(sub => sub.setName('notify-role').setDescription('設定通知角色').addRoleOption(o => o.setName('role').setDescription('角色')))
        .addSubcommand(sub => sub.setName('toggle-monitoring').setDescription('開關監控'))
        .addSubcommand(sub => sub.setName('force-reset').setDescription('強制重置狀態')),
    new SlashCommandBuilder().setName('ossc-history').setDescription('顯示歷史網址').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder().setName('ossc-status').setDescription('立即檢查狀態').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
].map(command => command.toJSON());

// ==========================================
// Discord Client 設定 (V3.1.0 優化版)
// ==========================================
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
    // 🔥 V3.1.0: 記憶體瘦身設定 (只快取必要的)
    makeCache: Options.cacheWithLimits({
        MessageManager: 0, 
        GuildMemberManager: { maxSize: 10, keepOverLimit: (m) => m.id === client.user.id },
        UserManager: 0,
        ThreadManager: 0,
        PresenceManager: 0,
        ReactionManager: 0,
    }),
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    let config = getConfig();
    if (!config || interaction.channelId !== config.command_channel_id) {
        await interaction.reply({ content: `❌ 請在 <#${config?.command_channel_id}> 使用指令。`, ephemeral: true });
        return;
    }

    if (commandName === 'ossc') {
        const sub = interaction.options.getSubcommand();
        if (sub === 'set-url') {
            const newUrl = interaction.options.getString('url');
            if (!newUrl.startsWith('http')) return interaction.reply({ content: '❌ URL 格式錯誤', ephemeral: true });
            if (config.current_url !== newUrl && !config.url_history.includes(config.current_url)) config.url_history.push(config.current_url);
            config.current_url = newUrl;
            if (saveConfig(config)) {
                lastConfirmedStatus = null; changeCounter = 0;
                await interaction.reply(`✅ 已切換監控目標為：\`${newUrl}\``);
            }
        } 
        else if (sub === 'set-interval') {
            const sec = interaction.options.getInteger('seconds');
            if (sec < 5) return interaction.reply({ content: '❌ 至少 5 秒', ephemeral: true });
            config.check_interval = sec * 1000;
            if (saveConfig(config)) {
                startMonitoringLoop();
                await interaction.reply(`✅ 檢查間隔已更新為 \`${sec} 秒\``);
            }
        }
        else if (sub === 'notify-role') {
            const role = interaction.options.getRole('role');
            config.notification_role_id = role ? role.id : null;
            saveConfig(config);
            await interaction.reply(role ? `✅ 已設定通知角色：<@&${role.id}>` : `✅ 已清除通知角色`);
        }
        else if (sub === 'toggle-monitoring') {
            config.monitoring_enabled = !config.monitoring_enabled;
            saveConfig(config);
            if (config.monitoring_enabled) { startMonitoringLoop(); await interaction.reply('✅ 監控已啟動'); }
            else { clearInterval(checkIntervalRef); await interaction.reply('⏸️ 監控已暫停'); }
        }
        else if (sub === 'force-reset') {
            lastConfirmedStatus = null; changeCounter = 0; startMonitoringLoop();
            await interaction.reply('🔄 狀態已強制重置');
        }
    } 
    else if (commandName === 'ossc-history') {
        await interaction.reply({ content: `📜 **歷史紀錄：**\n${config.url_history.join('\n') || '無'}`, ephemeral: true });
    }
    else if (commandName === 'ossc-status') {
        await interaction.deferReply();
        try {
            const res = await axios.get(config.current_url, { timeout: 5000 });
            await interaction.editReply(`🟢 狀態正常 (Code: ${res.status})`);
        } catch (e) {
            await interaction.editReply(`🔴 檢查失敗 (${e.message})`);
        }
    }
});

client.once('ready', () => {
    console.log(`登入成功！ ${client.user.tag}`);
    startMonitoringLoop();
    
    // 註冊指令 (單一伺服器)
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
        .then(() => console.log('✅ 指令註冊完成'))
        .catch(console.error);
});

client.login(DISCORD_TOKEN);