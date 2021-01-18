const fs = require('fs')
const Discord = require('discord.js');
const { prefix, token, servers, members } = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}


for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log('Ready!');
});

// Leave channel if everyone else leaves
client.on('voiceStateUpdate', (oldMember) => {
    var server = servers[oldMember.guild.id]
    if(!oldMember.channel) return
    if(oldMember.channel.members.size === 1 && oldMember.channel.members.has("471160470657695746"))
    {
        oldMember.member.send(`You've left me alone in the voice channel! Disconnecting in 30 seconds unless someone else joins.`)
        const leaveTimeout = setTimeout(() => {
            if(oldMember.channel.members.size === 1) {
                if(server.dispatcher) server.dispatcher.end()
            }
        }, 30000)
    }
})

client.on('message', message => {
    if(!message.member) return
    if(!members[message.member.user.id]) members[message.member.user.id] = {
        isSearching: false,
        videoSearchList: [],
        chosenVideo: null,
    }
    if(members[message.member.user.id].isSearching && /^[0-5]$/.test(message.content))
    {
        if(servers[message.guild.id].queue.length === 0)
        {
            message.reply(`you've chosen option [${message.content}], will play shortly.`)
        }
        else
        {
            message.reply(`you've chosen option ${message.content}, will be added to queue shortly.`)
        }
        let index = parseInt(message.content) - 1
        let member = members[message.member.user.id]
        member.chosenVideo = member.videoSearchList[index]
        member.videoSearchList = []
        member.isSearching = false
    }
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if(command.args && !args.length) {
        let reply = `You didn't provide any arguments`
        if(command.usage){
            reply += `\nThe proper usage would be: **${prefix}${command.name} ${command.usage}**`
        }
        return message.channel.send(reply);
    }

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

client.login(process.env.BOT_TOKEN);