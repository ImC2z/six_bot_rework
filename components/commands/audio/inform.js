const { SlashCommandBuilder, ChannelType } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`inform`)
.setDescription(`Inform a role about a voice channel's activity`)
.addChannelOption(option => 
    option.setName(`voice`)
    .setDescription(`channel to follow`)
    .setRequired(true)
    .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
)
.addRoleOption(option =>
    option.setName(`role`)
    .setDescription(`to be tagged`)
    .setRequired(true)
)
.addChannelOption(option => 
    option.setName(`text`)
    .setDescription(`channel to receive tag messages`)
    .setRequired(true)
    .addChannelTypes(ChannelType.GuildText)
);

module.exports = data