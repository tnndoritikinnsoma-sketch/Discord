import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { 
    generateAIResponse, 
    generateWithSpecificProvider,
    CORE_PROMPT 
} from '../utils/aiManager.js';
import { 
    addConversationMessage, 
    getConversationHistory, 
    clearConversationHistory,
    getCustomInstruction,
    setCustomInstruction,
    removeCustomInstruction,
    getChannelSetting
} from '../utils/database.js';
import { hasModPermission } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
    .setName('ai')
    .setDescription('AIアシスタント機能')
    .addSubcommand(sub =>
        sub.setName('chat')
            .setDescription('AIと会話します')
            .addStringOption(opt => opt.setName('message').setDescription('メッセージ').setRequired(true))
            .addStringOption(opt => opt.setName('provider').setDescription('AIモデルを選択').addChoices(
                { name: 'Gemini (Flash 2.0)', value: 'gemini' },
                { name: 'Groq (Llama 3.3)', value: 'groq' },
                { name: 'OpenRouter (Mistral)', value: 'openrouter' }
            )))
    .addSubcommand(sub =>
        sub.setName('clear')
            .setDescription('会話履歴をリセットします'))
    .addSubcommand(sub =>
        sub.setName('instruction')
            .setDescription('【管理者用】AIの追加命令を設定・削除します')
            .addStringOption(opt => opt.setName('text').setDescription('命令内容（空欄で削除）')));

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'chat') {
        await interaction.deferReply();
        const message = interaction.options.getString('message');
        const provider = interaction.options.getString('provider');
        const { guildId, channelId, user } = interaction;

        const history = getConversationHistory(guildId, channelId, user.id);
        const customIns = getCustomInstruction(guildId);
        
        const messages = [...history, { role: 'user', content: message }];

        try {
            const result = provider 
                ? await generateWithSpecificProvider(provider, messages, customIns)
                : await generateAIResponse(messages, customIns);

            addConversationMessage(guildId, channelId, user.id, 'user', message);
            addConversationMessage(guildId, channelId, user.id, 'assistant', result.text);

            const embed = new EmbedBuilder()
                .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
                .setDescription(result.text.slice(0, 4000))
                .setFooter({ text: `Model: ${result.provider}` })
                .setColor('#5865F2');

            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            await interaction.editReply(`エラー: ${e.message}`);
        }
    } 

    else if (sub === 'clear') {
        clearConversationHistory(interaction.guildId, interaction.channelId, interaction.user.id);
        await interaction.reply({ content: '会話履歴をリセットしました。', ephemeral: true });
    }

    else if (sub === 'instruction') {
        if (!hasModPermission(interaction.member)) {
            return interaction.reply({ content: '権限がありません。', ephemeral: true });
        }
        const text = interaction.options.getString('text');
        if (!text) {
            removeCustomInstruction(interaction.guildId);
            await interaction.reply('追加命令を削除しました。');
        } else {
            setCustomInstruction(interaction.guildId, text);
            await interaction.reply(`追加命令を設定しました:\n\`\`\`${text}\`\`\``);
        }
    }
}
