const { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { default: axios } = require("axios");

module.exports = {
	data: new SlashCommandBuilder()
	.setName("issue") // en
    .setNameLocalization("fr", "plainte") // fr
	.setDMPermission(false)
    .setDescription("Locked")
	// .setDescription("You want to complain?") // en
	.setDescriptionLocalization("fr", "Vous voulez vous plaindre ?") // fr
	.addSubcommand(group => group
		.setName("create") // en
		.setNameLocalization("fr", "créer") // fr
		.setDescription("Create an issue") // en
		.setDescriptionLocalization("fr", "Créez une plainte") // fr
		.addStringOption(sub => sub
			.setName("type") // global
			.setDescription("Select an issue type") // en
			.setDescriptionLocalization("fr", "Séléctionnez le type de plaintes") // fr
			.setChoices({ name: "Mod", value: "mod" }, { name: "Bot", value: "bot" }, { name: "Temp", value: "temp" })
			.setRequired(true)
			.setMaxLength(100)
		)
	),
	/**
	 * Issue Command
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const issueModal = new ModalBuilder()
        .setCustomId(`issue_${interaction.options.getString("type").toLowerCase()}`)
        .setTitle("Create an issue")
        .setComponents(
            new ActionRowBuilder()
            .setComponents(
                // body
                new TextInputBuilder()
                .setLabel("Body of your issue")
                .setMaxLength(256)
                .setRequired(true)
                .setPlaceholder("The Backrooms mod unexpectedly crashed")
                .setStyle(TextInputStyle.Short)
                .setCustomId("body")
            ),

            new ActionRowBuilder()
            .setComponents(
                // text
                new TextInputBuilder()
                .setLabel("Describe the issue")
                .setMaxLength(4000)
                .setRequired(true)
                .setPlaceholder("When I use the Silken Book, it says in the action bar that I need to click again")
                .setStyle(TextInputStyle.Paragraph)
                .setCustomId("text")
            )
        )

        await interaction.showModal(issueModal);
	}
};

/**
 * Axios's `get` function but better
 * @param {String} api 
 * @returns {any}
 */
async function get(api) {
	return await (await axios.get(api)).data;
}