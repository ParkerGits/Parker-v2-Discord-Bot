# Parker v2 Discord Music Bot 🎵

A bot I built with discord.js that plays music in the call!

## Commands and Functionality

### !play ( video url | playlist url | search terms )
- Parker v2 joins the voice call and plays the audio of a YouTube video.
- If a video URL is passed in, plays the audio from that video.
- If a playlist URL is passed in, adds all the songs from the playlist to the queue and plays the first in queue.
- If search terms are passed in, gives the user an option to pick from the first five YouTube search results.

### !queue
- Gives the current queue of videos that the server has lined up to play in the voice call.

### !skip [all]
- Begins a vote to skip the current video in queue and start playing the next video in queue.
- In order to skip video, bot requires a majority skip vote.
- Optional argument "all" skips all songs in queue.
- Members with the role "any %" bypass the vote and immediately skip the current video.

### !parkerquestion (question)
- Parker v2 asks Parker (me) for an answer to your provided question.
- (actually uses the Wolfram Alpha API to answer your question)

### !help [command]
- With no argument, sends the user a DM with a list of all commands.
- With optional argument "command", bot replies with information about the specific command.

### !avatar [user1, user2, ...]
- With no arguments, bot replies with the user's Discord profile picture.
- Users can tag server members as an argument to receive the profile pictures of each person tagged.
