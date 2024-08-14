const { SlashCommandBuilder, ChannelType } = require("discord.js");

const data = new SlashCommandBuilder()
.setName(`migrate`)
.setDescription(`Migrate all users in bot's voice channel`)
.addChannelOption(option =>
    option.setName(`destination`)
    .setDescription(`target voice channel`)
    .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
    .setRequired(true)
);

module.exports = data;