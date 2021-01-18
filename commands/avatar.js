module.exports = {
    name: 'avatar',
    description: 'Return your own avatar or avatar of mentioned users.',
    args: false,
    usage: `[user1, user2, ...]`,
    execute(message, args) {
        if(!message.mentions.users.size)
        {
            return message.channel.send(message.author.displayAvatarURL({ format: "png", dynamic: true }))
        }

        const avatarList = message.mentions.users.map(user => {
            return `${user.username}'s avatar: ${user.displayAvatarURL({ format: "png", dynamic: true })} `
        })

        message.channel.send(avatarList)
    }
}