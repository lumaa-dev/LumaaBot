const { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const { default: axios } = require("axios");
const { setFirstCap } = require("../functions/js/other");

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
	)
	.addSubcommand(group => group
		.setName("creator") // en
		.setNameLocalization("fr", "createur") // fr
		.setDescription("Get data about a creator") // en
		.setDescriptionLocalization("fr", "Obtenez des données sur un créateur") // fr
		.addStringOption(str => str
			.setName("name") // en
			.setNameLocalization("fr", "nom") // fr
			.setDescription("Name or ID of the creator") // en
			.setDescriptionLocalization("fr", "Nom ou identifiant du créateur") // fr
			.setMaxLength(39)
			.setRequired(true)
		)
	), 
		
	/**
	 * Modrinth Command
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		await interaction.deferReply();

        //let subgroup = interaction.options.getSubcommandGroup(); - no uses of subgroups 
        let sub = interaction.options.getSubcommand();
		
		if (sub == "project") {
			const id = interaction.options.getString("mod");
			const result = await (await get(`https://api.modrinth.com/v2/project/${id}`)).data
			
			var owner = await (await get(`https://api.modrinth.com/v2/project/${id}/members`)).data; 
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

				// author mods page
				new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL(`https://modrinth.com/user/${owner.user.username}/mods`)
				.setLabel(`${owner.user?.name ?? owner.user?.username}'s mods`)
			)

			await interaction.editReply({ embeds: [modEmbed], components: [modBtns] })
		} else if (sub == "creator") {
			const name = interaction.options.getString("name");
			const result = await (await get(`https://api.modrinth.com/v2/user/${name}`)).data;
			const userProjects = await (await get(`https://api.modrinth.com/v2/user/${name}/projects`)).data;
			var downloads = 0;
			var followers = 0;

			userProjects.forEach((project) => { downloads = downloads + project.downloads; followers = followers + project.followers});

			let embed = new EmbedBuilder()
			.setTitle(result.name ?? result.username)
			.setDescription(result.bio)
			.setURL(`https://modrinth.com/user/${result.username}`)
			.setColor("1bd96a")
			.setThumbnail(result.avatar_url)
			.setFields({ name: "Downloads", value: downloads.toString(), inline: true }, { name: "Followers", value: followers.toString(), inline: true }, { name: "Role", value: setFirstCap(result.role), inline: true })
		
			interaction.editReply({
				embeds: [embed]
			})
		}
	},
	/**
	 * Modrinth Autcomplete
	 * @param {AutocompleteInteraction} interaction 
	 */
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name == "mod") {
			/**@type {Object[]} */
			var results = await (await get(`https://api.modrinth.com/v2/search?limit=25&query=${focusedOption.value.toLowerCase()}`)).data.hits;
			results.filter(search => search.project_type === "mod")
		}

		await interaction.respond(
			results.map(choice => ({ name: choice.title, value: choice.project_id })),
		);
	}
};

/**
 * Axios's `get` function but better with an Authentication
 * @param {String} api 
 * @returns {Promise<import("axios").AxiosResponse<any, any>>}
 */
async function get(api) {
	// modrinth and github uses github tokens as authenticators
	try {
		return await (await axios.get(api, {headers: { "Authorization": `Bearer ${require("../functions/config.json").gh_token}`}}));
	} catch(e) {
		console.error(e);
	}
}
