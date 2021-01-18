const ytdl = require('ytdl-core')
const { servers } = require(`../config.json`)
const fetch = require(`node-fetch`)

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

module.exports = {
	name: 'parkerquestion',
	args: true,
    description: 'Ask Parker v2 to ask Parker (the original) a question.',
    usage: '<question>',
	async execute(message, args) {
        const WOLFRAM_APP_ID = process.env.WOLFRAM_APP_ID
        let questionString = ""
        args.map((arg) => {
            questionString += arg + " "
        })
        message.channel.send("Asking the original Parker your question...")
        fetch(`http://api.wolframalpha.com/v1/result?appid=${WOLFRAM_APP_ID}&i=${encodeURIComponent(questionString)}`)
            .then(res => res.text())
            .then(body => {
                if(body.includes("Wolfram|Alpha did not understand your input"))
                {
                    message.channel.send("Parker didn't understand your question.")
                    return
                }
                message.channel.send(`Parker says ${body.toLowerCase()}.`)
            })
        
	},
};