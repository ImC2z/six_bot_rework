const { SlashCommandBuilder } = require(`discord.js`);

const chat = new SlashCommandBuilder()
.setName(`chat`)
.setDescription(`Ask OpenAI about (almost) anything`)
.addStringOption(option => 
    option.setName(`query`)
    .setDescription(`request for OpenAI to answer`)
    .setRequired(true)
    .setMaxLength(300)
);

module.exports = chat;