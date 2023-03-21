const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { default: axios } = require("axios");
const { addGhCall, getClient, setFirstCap } = require("../functions/js/other");

const ghColor = "171515";

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
    )
    .addSubcommand(sub => sub
        .setName("user") // global
        .setNameLocalization("fr", "utilisateur") // fr
        .setDescription("Do stuff with GitHub users") // global
        .setDescriptionLocalization("fr", "Faites des choses avec les utilisateurs de GitHub")
        .addStringOption(str => str
            .setName("username") // global
            .setNameLocalization("fr", "utilisateur") // fr
            .setDescription("Username of the GitHub account") // global
            .setDescriptionLocalization("fr", "Nom d'utilisateur du compte GitHub") // fr
            .setMaxLength(39)
            .setRequired(true)
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

        // sub groups
        if (subgroup == "repository") {
            if (sub == "find") {
                await interaction.deferReply()

                let user = interaction.options.getString("user")
                let repo = interaction.options.getString("name")

                let api = `https://api.github.com/repos/${user}/${repo}`

                const result = await (await get(api)).data;
                var ghLinks = `**Links**:\n${result.homepage != "" ? "[Homepage - " + setFirstCap(getGroup(result.homepage)) + "](" + result.homepage + ")\n" : ""}${result.has_wiki ? "[Wiki](" + result.html_url + "/wiki)\n" : ""}${result.has_issues ? "[Issues](" + result.html_url + "/issues)\n" : ""}${result.has_projects ? "[Projects](" + result.html_url + "/projects)\n" : ""}${result.has_discussions ? "[Discussions](" + result.html_url + "/discussions)" : ""}`
                if (ghLinks == "**Links**:\n") ghLinks = "";

                var actionrow1 = new ActionRowBuilder();
                if (result.homepage != "") {
                    actionrow1.addComponents(
                        new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setURL(result.homepage)
                        .setLabel(setFirstCap(getGroup(linkRegex, result.homepage)[0]))
                    )
                }

                actionrow1.addComponents(
                    new ButtonBuilder()
                    .setLabel("Creator")
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
                        .setColor(ghColor)
                    ],
                    components: [actionrow1]
                })
            }
        }

        // sub
        if (sub == "user") {
            await interaction.deferReply()

            const user = interaction.options.getString("username");

            const result = await (await get(`https://api.github.com/users/${user}`)).data

            let userEmbed = new EmbedBuilder()
            .setTitle(result.name ?? result.login)
            .setDescription(result.bio)
            .setURL(result.html_url)
            .setThumbnail(result.avatar_url)
            .setColor(ghColor)
            .setFooter({ text: "Last update" })
            .setTimestamp(new Date(result.updated_at))
            .setAuthor({ name: "GitHub", url: "https://github.com/" })
            .setFields({ name: "Followers", value: result.followers.toString(), inline: true }, { name: "Following", value: result.following.toString(), inline: true }, { name: "Repositories", value: result.public_repos.toString(), inline: false })

            let linksEmbed = new EmbedBuilder()
            .setDescription(`📍 ${result.location ?? "*Not defined by the user*"}
            🔗 ${result.blog.length > 1 ? result.blog : "*Not defined by the user*"}
            🐦 [@${result.twitter_username ?? "not_defined_by_the_user"}](https://twitter.com/${result.twitter_username ?? ""})
            ✉️ [${result.mail ?? "notdefinedby@user"}](mailto:${result.email ?? ""})
            `) // mailto: doesn't work on Discord
            .setColor("Blue")

            if (result.blog == "" && result.twitter_username == null && result.mail == null && result.location == null) {
                await interaction.editReply({
                    embeds: [userEmbed]
                })
            } else {
                await interaction.editReply({
                    embeds: [userEmbed, linksEmbed]
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
function getGroup(str, regexp = /(http(s)?:\/\/([a-z]+\.)?([^/\r\n]+)(\..+))/gi, group = 4) {
    let x = Array.from(str.matchAll(regexp), m => m[group]);
    if (x.length == 1) { return x[0] } else { return x }
}