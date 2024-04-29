const { SlashCommandBuilder, ChannelType } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`go`)
.setDescription(`Send to bot to a voice channel`)
.addChannelOption(option => 
    option.setName(`channel`)
    .setDescription(`name of voice channel`)
    .setRequired(true)
    .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
);

module.exports = data