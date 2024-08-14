const { SlashCommandBuilder } = require(`discord.js`);

const prompt = new SlashCommandBuilder()
.setName(`prompt`)
.setDescription(`Ask OpenAI about (almost) anything`)
.addStringOption(option => 
    option.setName(`query`)
    .setDescription(`request for OpenAI to answer`)
    .setRequired(true)
    .setMaxLength(300)
);

module.exports = prompt;