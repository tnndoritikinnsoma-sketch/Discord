import { SlashCommandBuilder } from 'discord.js';
import { addModRole, removeModRole, getModRoles } from '../utils/database.js';

export const data = new SlashCommandBuilder()
    .setName('addmods')
    .setDescription('Modロールの管理')
    .addRoleOption(opt => opt.setName('role').setDescription('設定するロール').setRequired(true))
    .addBooleanOption(opt => opt.setName('remove').setDescription('削除する場合はTrue'));

export async function execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: 'この操作にはサーバー管理者権限が必要です。', ephemeral: true });
    }

    const role = interaction.options.getRole('role');
    const isRemove = interaction.options.getBoolean('remove');

    if (isRemove) {
        removeModRole(interaction.guildId, role.id);
        await interaction.reply(`Modロールから ${role.name} を削除しました。`);
    } else {
        addModRole(interaction.guildId, role.id);
        await interaction.reply(`Modロールに ${role.name} を追加しました。`);
    }
}
