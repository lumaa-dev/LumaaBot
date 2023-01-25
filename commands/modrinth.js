const { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const { default: axios } = require("axios");

module.exports = {
	data: new SlashCommandBuilder()
	.setName("modrinth") // global
	.setDMPermission(false)
	.setDescription("Modrinth related commands") // en
	.setDescriptionLocalization("fr", "Commandes liées à Modrinth") // fr
	.addSubcommand(group => group
		.setName("project") // en
		.setNameLocalization("fr", "projet") // fr
		.setDescription("Get informations about a Modrinth project") // en
		.setDescriptionLocalization("fr", "Obtenez des informations sur un project Modrinth") // fr
		.addStringOption(sub => sub
			.setName("mod") // global
			.setDescription("Get a Modrinth mod project") // en
			.setDescriptionLocalization("fr", "Obtenez un projet Modrinth de mod") // fr
			.setAutocomplete(true)
			.setRequired(true)
			.setMaxLength(100)
		)
	),
	/**
	 * Modrinth Command
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		await interaction.deferReply();

		const id = interaction.options.getString("mod");
		const result = await get(`https://api.modrinth.com/v2/project/${id}`)
		
		var owner = await get(`https://api.modrinth.com/v2/project/${id}/members`); 
		owner = owner.filter(member => member.role.toLowerCase() == "owner")[0];

		const modEmbed = new EmbedBuilder()
		.setTitle(result.title)
		.setDescription(result.description)
		.setAuthor({ name: owner.user?.name ?? owner.user.username, iconURL: owner.user.avatar_url, url: `https://modrinth.com/user/${owner.user.username}`})
		.setURL(`https://modrinth.com/mod/${id}`)
		.setColor("1bd96a")
		.setThumbnail(result.icon_url)
		.setFields({ name: "Downloads", value: `${result.downloads}`, inline: true }, { name: "Followers", value: `${result.followers}`, inline: true })

		if (result.gallery.length > 0) {
			let featured = result.gallery.filter(img => img.featured == true)[0];
			if (featured) modEmbed.setImage(featured.url)
		}

		const modBtns = new ActionRowBuilder()
		.setComponents(
			// description tab
			new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(`https://modrinth.com/mod/${id}`)
			.setLabel("Open in Modrinth"),

			// author page
			new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(`https://modrinth.com/user/${owner.user.username}?type=mod`)
			.setLabel(`More mods by ${owner.user?.name ?? owner.user.username}`)
		)

		await interaction.editReply({ embeds: [modEmbed], components: [modBtns] })
	},
	/**
	 * Modrinth Autcomplete
	 * @param {AutocompleteInteraction} interaction 
	 */
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name == "mod") {
			/**@type {Object[]} */
			var results = await (await get(`https://api.modrinth.com/v2/search?limit=25&query=${focusedOption.value.toLowerCase()}`)).hits;
			results.filter(search => search.project_type === "mod")
		}

		await interaction.respond(
			results.map(choice => ({ name: choice.title, value: choice.project_id })),
		);
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
