const ytdl = require('ytdl-core')
const ytpl = require('ytpl')
const he = require("he")
const { servers, opts, members, SEARCH_TIMEOUT_MS } = require(`../config.json`)
opts.key = process.env.YOUTUBE_KEY
const search = require('youtube-search')
const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'play',
    args: true,
	aliases: ['listen'],
    description: `Streams audio from bot. Can specify a Youtube Video URL, a Youtube Playlist URL, or Youtube search terms.`,
    usage: '<video-url, playlist-url, search-terms>',
	async execute(message, args) {
        // return if member has role ("nobody")
        if(message.member.roles.cache.some(role => role.name === "nobody")) return
        function play(connection, message){
            var server = servers[message.guild.id]
            let videoTitle = server.queue[0].title
            let videoURL = server.queue[0].url
            let videoAuthor = server.queue[0].author
            // download first video in queue with ytdl and play through server dispatcher
            server.dispatcher = connection.play(ytdl(videoURL, { filter: "audioonly" }))
            console.log(videoTitle)
            message.channel.send(`\`\`\`css\n[Now Playing]: ${videoTitle} | [${videoAuthor}]\n\`\`\``)
            // when video is finished
            server.dispatcher.on("finish", function() {
                console.log("Video ended.")
                message.channel.send(`\`\`\`css\n[Video Ended]: ${videoTitle} | [${videoAuthor}]\n\`\`\``)
                // shift to next video in queue
                server.queue.shift();
                // if another video exists in queue, play. otherwise, disconnect from voice.
                if(server.queue[0]){
                    play(connection,message)
                }
                else{
                    connection.disconnect();
                }
            })
        }
        // Return if message is not from a server
        if(!message.guild) return;
        // Return if message sender is not in a voice channel
        if(!message.member.voice.channel)
        {
            message.reply("please join a voice channel first.")
            return;
        }
        // Join voice channel
        const connection = await message.member.voice.channel.join()
        // To allow multiple queues among different servers:
        // If server does not have key stored in servers, create object in servers with key message.guild.id
		if(!servers[message.guild.id]) servers[message.guild.id] = {
			queue: [],
			vote: {
				skipAll: false,
				skipVoteCount: 0,
				idVoters: [],
			}
        }
        var server = servers[message.guild.id];
        // If argument is a Youtube URL
        if(args[0].includes("youtube.com"))
        {
            // If argument is a Youtube playlist
            if(args[0].includes("playlist"))
            {
                ytpl.getPlaylistID(args[0], (err, id)=>{
                    if(err) {
                        message.reply("there was an error fetching playlist ID.")
                        return
                    }
                    ytpl(id, (err, res) => {
                        if(err){
                            message.reply("there was an error fetching playlist details")
                            return
                        }
                        if(res.total_items > 100)
                        {
                            console.log("Playlist contains more than 100 items")
                            message.channel.send(`\`\`\`fix\nCannot add more than 100 items from playlist.\n\`\`\``)
                            message.channel.send(`\`\`\`css\n[Adding to Queue]: 100 videos from [${res.title}]\n\`\`\``)
                        }
                        else {
                            message.channel.send(`\`\`\`css\n[Adding to Queue]: ${res.total_items} videos from [${res.title}]\n\`\`\``)
                        }
                        res.items.map((item, i)=>{
                            let video = { title: item.title, url: item.url_simple, author: item.author.name, playerId: message.member.user.id }
                            server.queue.push(video)
                        })
                        message.channel.send(`\`\`\`fix\nVideos added to queue.\n\`\`\``)
                        play(connection, message)
                    })
                })
                return
            }
            // If link is a single video
            // fetch details about video
            let newVideoDetails = (await ytdl.getBasicInfo(args[0])).videoDetails
            // create video object and push it to queue
            let video = { title: newVideoDetails.title, url: newVideoDetails.video_url, author: newVideoDetails.author.name, playerId: message.member.user.id }
            server.queue.push(video)
            // Play the video if it's the only one in queue, otherwise inform user that video has been added to queue
            if(server.queue.length === 1)
            {
                play(connection, message)
            } else {
                console.log(`${video.title} has been added to queue.`)
                message.channel.send(`\`\`\`css\nAdded to queue: ${video.title} | [${video.author}]\n\`\`\``)
            }
        }
        // If video isn't a youtube URL
        else
        {

            var member = members[message.member.user.id]
            // Return if member has a previous search request that has not been fulfilled.
            if(member.isSearching)
            {
                message.reply(`please pick a video from your original search request or wait for that request to time out.`)
                return
            }
            member.isSearching=true;
            // concatenate arguments to form user query
            let userQuery = "";
            args.map((arg)=>{
                userQuery+=arg + " "
            })
            try {
                // Fetch search results from youtube with userQuery and opts
                search(userQuery, opts, async function(err, results) {
                    if(err) return console.log(err)
                    const searchEmbed = new MessageEmbed()
                        .setDescription("Type number to select video:")
                        .setThumbnail(`https://i1.wp.com/tatcomic.com/wp-content/uploads/2012/07/totoromusic.jpg`)
                        .setAuthor(`${message.member.user.username}'s Search`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                        .setFooter(`Search times out in ${SEARCH_TIMEOUT_MS/1000} seconds.`)
                    // Format result string
                    for(let i = 0; i<opts.maxResults; i++)
                    {
                        let resultTitle = await results[i].title
                        resultTitle = he.decode(resultTitle)
                        let resultAuthor = await results[i].channelTitle
                        // let resultLink = await results[i].link
                        /*let resultLength = (await ytdl.getBasicInfo(resultLink)).videoDetails.lengthSeconds
                        let formattedResultLength = `${Math.floor(resultLength / 60)}:${resultLength % 60}`*/
                        searchEmbed.addField(`[${i+1}]: ${resultTitle}`, `[${resultAuthor}]`)
                        member.videoSearchList.push(results[i])
                    }
                    message.channel.send(searchEmbed)
                });
            } catch (error) {
                message.reply("Cannot access Youtube Data API at this time.")
                return;
            }
            // after SEARCH_TIMEOUT_MS amount of time, set isSearching false, reset videoSearchList, and disconnect from voice chat if nothing is playing.
            let searchTimeout = setTimeout(() => {
                member.isSearching = false;
                member.videoSearchList = []
                if(server.queue.length===0)
                {
                    connection.disconnect();
                }
                message.reply("your search request has timed out.")
            }, SEARCH_TIMEOUT_MS)
            // every second, check if user has chosen a video
            let chosenVideoCheck = setInterval(async () => {
                if(member.chosenVideo != null)
                {
                    // stop repeating checks and timeout
                    clearInterval(chosenVideoCheck)
                    clearTimeout(searchTimeout)
                    // member is no longer searching, reset videoSearchList
                    member.isSearching = false
                    member.videoSearchList = []
                    // create video object and add it to queue
                    let video = { title: he.decode(member.chosenVideo.title), url: member.chosenVideo.link, author: member.chosenVideo.channelTitle, playerId: message.member.user.id }
                    server.queue.push(video)
                    // reset chosen video to null
                    member.chosenVideo = null;
                    // Play the video if it's the only one in queue, otherwise inform user that video has been added to queue
                    if(server.queue.length === 1)
                    {
                        play(connection, message)
                    }
                    else
                    {
                        console.log(`${video.title} has been added to queue.`)
                        message.channel.send(`\`\`\`fix\nAdded to queue: ${video.title} | ${video.author}\n\`\`\``)
                    }
                }
            }, 1000)
        }
	},
};
