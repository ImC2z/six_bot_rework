const { SlashCommandBuilder, ChannelType } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`uninformall`)
.setDescription(`Uninform all roles about a voice channel's activity`)
.addChannelOption(option => 
    option.setName(`voice`)
    .setDescription(`channel to unfollow`)
    .setRequired(true)
    .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
)

module.exports = data