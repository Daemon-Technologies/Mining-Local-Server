import fs from "fs"
import request from "request"
import { checkStacksNodeExists, downloadStacksNode } from '../utils/stacksNode.js'
import { selectSystem } from '../utils/utils.js'
import { Server } from "socket.io";


export function createWebsocketChannel(httpServer) {
    
    const io = new Server(httpServer, {})

    io.on('connection', (socket) => {

        socket.on("download", async (msg ,b) => {
            console.log(msg, b)
            downloadStacksNode(msg)
        });
        
        console.log("user connected");
    })
}

