const ytdl = require('ytdl-core')
const { servers } = require(`../config.json`)
const { MessageEmbed } = require('discord.js')
module.exports = {
	name: 'queue',
	args: false,
	description: 'View video queue.',
	execute(message, args) {
		if(!servers[message.guild.id]) servers[message.guild.id] = {
			queue: [],
			vote: {
				skipAll: false,
				skipVoteCount: 0,
				idVoters: [],
			}
        }
        var server = servers[message.guild.id]
        console.log(server.queue)
        if(server.queue.length === 0)
        {
            message.channel.send("No videos in queue!")
            return;
        }
        const queueEmbed = new MessageEmbed()
                        .setTitle("Server Queue")
                        .setThumbnail(`https://2.bp.blogspot.com/-45-sYMsNfN8/UBhkyfMcZUI/AAAAAAAACIg/nq6WRN4zNxA/s320/Totoro.png`)
        for(let i = 0; i<server.queue.length; i++)
        {
            let video = server.queue[i]
            if(i === 10)
            {
                console.log("More than 10 videos in queue.")
                queueEmbed.setFooter(`and ${server.queue.length - 10} more...\n\n`)
                break
            }
            queueEmbed.addField(`${i+1}. ${video.title}`, `[${video.author}]`)
        }
        message.channel.send(queueEmbed)
	},
};