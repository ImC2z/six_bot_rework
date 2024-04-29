const { SlashCommandBuilder } = require(`discord.js`);

const data = new SlashCommandBuilder()
.setName(`q`)
.setDescription(`Display the current queue of videos`)
.addIntegerOption(option =>
    option.setName(`start`)
    .setDescription(`Starting queue position`)
    .setRequired(false)        
    .setMinValue(1)
);

module.exports = data