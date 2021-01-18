const ytdl = require('ytdl-core')
const { servers, SKIP_VOTE_TIMEOUT_MS } = require(`../config.json`)
module.exports = {
	name: 'skip',
	args: false,
	usage: "[all]",
	description: `Starts a vote to skip to the next video in !queue. Vote requires a majority for video to be skipped. Can also vote to skip all videos in queue by specifying \"all\" as an argument.`,
	execute(message, args) {
		// return if not in same voice call as bot
		if(!message.member.voice.channel || !message.member.voice.channel.members.has("471160470657695746")) {
			message.reply("join the same voice channel as the bot, or have the bot join yours.")
			return
		}
		if(!servers[message.guild.id]) servers[message.guild.id] = {
			queue: [],
			vote: {
				skipAll: false,
				skipVoteCount: 0,
				idVoters: [],
			}
        }
		var server = servers[message.guild.id]
		// if has the "any %" role, skip immediately.
		if(message.member.roles.cache.some(role => role.name === "any %"))
		{
			if(args[0] === "all" || server.queue.length <= parseInt(args[0]))
			{
				console.log("Removing all videos in queue.")
				server.queue.splice(1)
				if(server.dispatcher) server.dispatcher.end()
				return
			}
			if(server.dispatcher) server.dispatcher.end()
			return
		}
		// if member is the one who added the video
		if(message.member.user.id === server.queue[0].playerId) {
			if(server.dispatcher) server.dispatcher.end()
			return
		}
		let numMembersVoice = message.member.voice.channel.members.size-1
		let minNumVotes = Math.ceil(numMembersVoice/2)
		// if member has already voted on this attempt, return
		let hasVoted = false
		server.vote.idVoters.map((id)=>{
			if(message.member.user.id === id)
			{
				message.reply(`you've already voted!`)
				message.channel.send(`\`\`\`css\n[VOTE !skip]: ${server.vote.skipVoteCount} Vote${server.vote.skipVoteCount === 1 ? `` : `s`} Tallied | ${minNumVotes} Total Votes Required\`\`\``)
				hasVoted = true;
			}
		})
		if(hasVoted) return
		// New vote:
		if(args[0] && args[0] === "all")
		{
			server.vote.skipAll = true
		}
		let voteTimeout;
		if(server.vote.skipVoteCount === 0) {
			// Start timer on vote
			message.channel.send(`\`\`\`fix\n[VOTE !skip${server.vote.skipAll ? " all": ""}]: SERVER HAS ${SKIP_VOTE_TIMEOUT_MS/1000} SECONDS TO REACH ${minNumVotes} VOTES IN ORDER TO [!skip${server.vote.skipAll ? " all": ""}]\`\`\``)
			// after SKIP_VOTE_TIMEOUT_MS time, reset idVoters and skipVoteCount
			voteTimeout = setTimeout(()=>{
				message.channel.send(`\`\`\`fix\n[VOTE !skip${server.vote.skipAll ? "all": ""}] VOTE HAS TIMED OUT\`\`\``)
				server.vote.skipVoteCount = 0
				server.vote.idVoters = []
				server.vote.skipAll = false
			}, SKIP_VOTE_TIMEOUT_MS)
		}
		// member.hasVoted = true, skipVoteCount + 1, add voter id to server.vote.idVoters
		server.vote.idVoters.push(message.member.user.id)
		server.vote.skipVoteCount += 1
		message.channel.send(`\`\`\`css\n[VOTE !skip${server.vote.skipAll ? " all": ""}]: ${server.vote.skipVoteCount} Total Vote${server.vote.skipVoteCount === 1 ? `` : `s`} Tallied | ${minNumVotes} Total Votes Required\`\`\``)
		if(server.vote.skipVoteCount >= minNumVotes) {
			message.channel.send(`\`\`\`css\n[VOTE !skip${server.vote.skipAll ? " all": ""}]: At least 50% in favor of [!skip${server.vote.skipAll ? " all": ""}]. Now skipping...\`\`\``)
			server.vote.skipVoteCount = 0
			server.vote.idVoters = []
			if(server.vote.skipAll = true)
			{
				console.log("Removing all videos in queue.")
				server.queue.splice(1)
			}
			if(server.dispatcher) server.dispatcher.end()
			clearTimeout(voteTimeout)
		}
	}
};