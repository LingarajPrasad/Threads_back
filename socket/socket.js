import {Server} from 'socket.io'
import http from 'http'
import express from 'express'

const app=express()
const server=http.createServer(app)
const io=new Server(server,{
    cors:{
        origin:"http://localhost:8000",
        methods:["GET","POST"]
    }
})

const userSocketMap={}
io.on('connection',(socket)=>{
    console.log("User connected",socket.id)
const  userid = socket.handshake.query.userid
if(userid != 'undefined') userSocketMap[userid]=socket.id
io.emit('getOnlineUsers',Object.keys(userSocketMap))
    socket.on('disconnect',()=>{
        console.log("disconnected")
    })
})

export {io,server,app}