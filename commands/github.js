const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { default: axios } = require("axios");
const { addGhCall, getClient, setFirstCap } = require("../functions/js/other");

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
            .setName("find")
            .setNameLocalization("fr", "trouver")
            .setDescription("Find a repository and get quick informations")
            .setDescriptionLocalization("fr", "Trouvez un dépôt et obtenez des infos rapidement")
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
        if (getClient().ghCalls <= 100) {
            return interaction.reply({ ephemeral: true, content: "Error:\n```The amount of remaining GitHub API calls is too low (" + getClient().ghCalls + ")"})
        }
        let subgroup = interaction.options.getSubcommandGroup();
        let sub = interaction.options.getSubcommand();

        if (subgroup == "repository") {
            if (sub == "find") {
                const linkRegex = /(http(s)?:\/\/([a-z]+\.)?([^/\r\n]+)(\..+))/gi;
                await interaction.deferReply()

                let user = interaction.options.getString("user")
                let repo = interaction.options.getString("name")

                let api = `https://api.github.com/repos/${user}/${repo}`

                const result = await (await get(api)).data;
                var ghLinks = `**Links**:\n${result.homepage != "" ? "[Homepage - " + setFirstCap(getGroup(linkRegex, result.homepage)[0]) + "](" + result.homepage + ")\n" : ""}${result.has_wiki ? "[Wiki](" + result.html_url + "/wiki)\n" : ""}${result.has_issues ? "[Issues](" + result.html_url + "/issues)\n" : ""}${result.has_projects ? "[Projects](" + result.html_url + "/projects)\n" : ""}${result.has_discussions ? "[Discussions](" + result.html_url + "/discussions)" : ""}`
                if (ghLinks == "**Links**:\n") ghLinks = "";

                var actionrow1 = new ActionRowBuilder();
                if (result.homepage != "") {

                    actionrow1.addComponents(
                        new ButtonBuilder()
                        .setLabel("Homepage")
                        .setStyle(ButtonStyle.Link)
                        .setURL(result.homepage)
                        .setLabel(setFirstCap(getGroup(linkRegex, result.homepage)[0]))
                    )
                }

                actionrow1.addComponents(
                    new ButtonBuilder()
                    .setLabel("Owner")
                    .setCustomId("gh-owner")
                    .setStyle(ButtonStyle.Secondary)
                )

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle(result.full_name)
                        .setURL(result.html_url)
                        .setDescription(`${result.fork ? "*Fork of [" + result.parent?.full_name + "](" + result.parent?.html_url+ ")*" : ""}\n${result.description}\n\n${ghLinks}`)
                        .setAuthor({ name: result.owner.login, url: result.owner.html_url, iconURL: result.owner.avatar_url })
                        .setColor("#171515")
                    ],
                    components: [actionrow1]
                })
            }
        }
    }
}

/**
 * Axios's `get` function but for GitHub
 * @param {String} api 
 * @returns {Promise<import("axios").AxiosResponse<any, any>>}
 */
async function get(api) {
	let x = await (await axios.get(api, {headers: { "Authorization": `Bearer ${require("../functions/config.json").gh_token}`}}));
    addGhCall();
    console.log(x);
    return x;
}

// default 4th group bc it's website name
function getGroup(regexp, str, group = 4) {
    return Array.from(str.matchAll(regexp), m => m[group]);
}