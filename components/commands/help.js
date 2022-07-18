const { SlashCommandBuilder } = require('discord.js');
const fs = require(`fs`);

const optionChoices = [];
const commandCategories = fs.readdirSync(`./components/commands`).filter(file => !file.endsWith(`.js`));
for (const category of commandCategories) {
	optionChoices.push({ name: category, value: category });
}  

const format = new SlashCommandBuilder()
	.setName('help')
	.setDescription(`Display the help menu`)
	.addStringOption(option =>
		option.setName('category')
			.setDescription('Help category')
			.setRequired(false)
            .addChoices(...optionChoices));

module.exports = format