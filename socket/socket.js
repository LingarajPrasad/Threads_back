import { Server } from 'socket.io'
import http from 'http'
import express from 'express'
import Message from "../models/messageModel.js"
import Conversation from '../models/conversationModel.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        // origin: "https://trf.onrender.com",
        origin: "http://localhost:8000",
        methods: ["GET", "POST"]
    }
})

export const getRecipientSocketId=(recipientId)=>{
    return userSocketMap[recipientId]}
const userSocketMap = {}
io.on('connection', (socket) => {
    console.log("User connected", socket.id)
    const userid = socket.handshake.query.userid


    if (userid != 'undefined') userSocketMap[userid] = socket.id
    io.emit('getOnlineUsers', Object.keys(userSocketMap))

    socket.on("markMessageAsSeen", async ({ conversationId, userid }) => {
		try {
			await Message.updateMany({ conversationId: conversationId, seen: false }, { $set: { seen: true } });
			await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });
			io.to(userSocketMap[userid]).emit("messagesSeen", { conversationId });
		} catch (error) {
			console.log(error);
		}
	});

    socket.on('disconnect', () => {
        console.log("disconnected")
        delete userSocketMap[userid]
        io.emit('getOnlineUsers', Object.keys(userSocketMap))
    })
})

export { io, server, app }