import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.commands = new Collection();

// コマンド読み込み
const commandsPath = path.resolve('src/commands');
if (readdirSync(path.resolve('src')).includes('commands')) {
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = pathToFileURL(path.join(commandsPath, file)).href;
        const command = await import(filePath);
        if (command.data) client.commands.set(command.data.name, command);
    }
}

// イベント読み込み
const eventsPath = path.resolve('src/events');
if (readdirSync(path.resolve('src')).includes('events')) {
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = pathToFileURL(path.join(eventsPath, file)).href;
        const event = await import(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// スラッシュコマンド実行用
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
