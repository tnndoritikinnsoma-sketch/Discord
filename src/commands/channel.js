import { SlashCommandBuilder } from 'discord.js';
import { setChannelSetting, removeChannelSetting } from '../utils/database.js';
import { hasModPermission } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
    .setName('channel')
    .setDescription('チャンネル設定')
    .addStringOption(opt => opt.setName('status').setDescription('AIの応答設定').addChoices(
        { name: '有効', value: 'on' },
        { name: '無効', value: 'off' }
    ).setRequired(true));

export async function execute(interaction) {
    if (!hasModPermission(interaction.member)) {
        return interaction.reply({ content: '権限がありません。', ephemeral: true });
    }

    const status = interaction.options.getString('status');
    if (status === 'on') {
        setChannelSetting(interaction.guildId, interaction.channelId, { ai: true });
        await interaction.reply('このチャンネルでAI応答を有効にしました。');
    } else {
        removeChannelSetting(interaction.guildId, interaction.channelId);
        await interaction.reply('このチャンネルの設定をリセットしました。');
    }
}
