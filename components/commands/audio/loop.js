const { SlashCommandBuilder } = require(`discord.js`);

const modeChoices = [
    { name: `quit`, value: `none` },
    { name: `1`, value: `one` },
    { name: `all`, value: `all` }
];

const data = new SlashCommandBuilder()
.setName(`loop`)
.setDescription(`Set loop mode for current playlist`)
.addStringOption(option =>
    option.setName(`mode`)
    .setDescription(`Loop mode`)
    .setRequired(true)
    .addChoices(...modeChoices)
);
            

module.exports = data