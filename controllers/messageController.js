import Conversation from '../models/conversationModel.js'
import Message from '../models/messageModel.js'
import { getRecipientSocketId, io } from '../socket/socket.js'


//to send a message
async function sendMessage(req, res) {
    try {
        const { recipientId, message } = req.body
        const senderId = req.user._id
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] }
        })
        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId],
                lastMessage: {
                    text: message,
                    sender: senderId,
                }
            })
            await conversation.save()
        }
        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            text: message
        })
        await Promise.all([
            newMessage.save(),
            conversation.updateOne({
                lastMessage: {
                    text: message,
                    sender: senderId
                }
            })
        ])
        const recipientSocketId=getRecipientSocketId(recipientId)
        if (recipientSocketId){
            io.to(recipientSocketId).emit("newMessage",newMessage)
        }
        
        res.status(201).json(newMessage)
    } catch (err) {
        res.status(500).json({ err: err.message })
    }
}

//To get all chats between 2 user
async function getMessage(req, res) {
    const { otherUserId } = req.params
    const userId = req.user._id
    // console.log(userId)
    // console.log(otherUserId)
    try {
        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        })
        if (!conversation) {
            return res.status(404).json({ error: "NO katha barta" })
        }
        const message = await Message.find({
            conversationId: conversation._id
        }).sort({ createdAt: 1 })
        res.status(200).json(message)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

//To get last message between current user and all users
async function getConversations(req, res) {
    const userId = req.user._id
    try {
        const conversation = await Conversation.find({
            participants: userId
        }).populate({
            path: 'participants',
            select: "username profilePic"
        })

        conversation.forEach(conversation=>{
            conversation.participants=conversation.participants.filter(

                participants=>participants._id.toString() !==userId.toString()
            )
        })


        res.status(200).json(conversation)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


export { sendMessage, getMessage, getConversations }