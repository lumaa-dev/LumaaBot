const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("github") // global
    .setDescription("Command all about GitHub")
    .setDescriptionLocalization("fr", "Commande à propos de GitHub")
    .addSubcommandGroup(group => group
        .setName("repository") // global
        .setDescription("Get informations about a repository") // en
        .setDescriptionLocalization("fr", "Obtenez des informations sur un dépôt")
        .addSubcommand(sub => sub
            .setName("search")
            .setNameLocalization("fr", "recherche")
            .setDescription("Search a repository and get quick informations")
            .setDescriptionLocalization("fr", "Recherchez un dépôt et obtenez des infos rapidement")
            .addStringOption(str => str
                .setName("user")
                .setNameLocalization("fr", "utilisateur")
                .setDescription("The owner of the repository")
                .setDescriptionLocalization("fr", "Le propriétaire du dépôt")
                .setRequired(true)
                .setMaxLength(39))
            .addStringOption(str => str
                .setName("name")
                .setNameLocalization("fr", "nom")
                .setDescription("Name of the repository")
                .setDescriptionLocalization("fr", "Nom du dépôt")
                .setRequired(true)
                .setMaxLength(100)
            )
        )
    ),

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        let subgroup = interaction.options.getSubcommandGroup();
        let sub = interaction.options.getSubcommand();

        if (subgroup == "repository") {
            if (sub == "search") {
                await interaction.deferReply()

                let user = interaction.options.getString("user")
                let repo = interaction.options.getString("name")

                let api = `https://api.github.com/repos/${user}/${repo}`

                const result = await get(api)

                var ghLinks = `${result.has_wiki ? "[Wiki](" + result.html_url + "/wiki)" : ""}\n${result.has_issues ? "[Issues](" + result.html_url + "/issues)" : ""}\n${result.has_projects ? "[Projects](" + result.html_url + "/projects)" : ""}\n${result.has_discussions ? "[Discussions](" + result.html_url + "/discussions)" : ""}`

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle(result.full_name)
                        .setURL(result.html_url)
                        .setDescription(api.description + "\n" + result.fork ? `*Fork of [${result.parent.full_name}](${result.parent.html_url})*` : "" + ghLinks)
                        .setAuthor({ name: "GitHub", url: "https://github.com/" })
                    ]
                })
            }
        }
    }
}

/**
 * Axios's `get` function but better
 * @param {String} api 
 * @returns {any}
 */
 async function get(api) {
	return await (await axios.get(api)).data;
}