import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('ボットの使い方を表示します');

export async function execute(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('AI Assistant Bot Help')
        .addFields(
            { name: '/ai chat', value: 'AIと会話します。モデルの選択も可能です。' },
            { name: '/ai clear', value: '自分の会話履歴を消去します。' },
            { name: '/ai instruction', value: '【管理者】サーバー専用のAI人格を設定します。' },
            { name: '/addmods', value: '【管理者】ボットを操作できるロールを設定します。' }
        )
        .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
}
