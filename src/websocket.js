import fs from "fs"
import request from "request"
import { checkStacksNodeExists } from '../utils/stacksNode.js'
import { selectSystem } from '../utils/utils.js'
import { Server } from "socket.io";

export function createWebsocketChannel(httpServer) {
    
    const io = new Server(httpServer, {})

    io.on('connection', (socket) => {

        socket.on("download", async (msg ,b) => {
            console.log(msg, b)
            let exists = await checkStacksNodeExists()
            console.log(exists)
            if (exists) {
                return;
            }
            let system = selectSystem()
            let file_url = 'https://github.com/Daemon-Technologies/Mining-Bot/releases/download/1.0.0/stacks-node-'
            switch (system){
                case "darwin": file_url+="mac"
                            break;
                case "linux":  file_url+=system
                            break;
                case "default": return "Do not support other system except Darwin and linux";
            }
            let out = fs.createWriteStream('stacks-node')
            
            let req = request({
                method: 'GET',
                uri: file_url
            })
            let cur = 0;
            let total = 0;
            let percent = 0;
            let lastPercent = 0;
            req.pipe(out);

            req.on('data', function (chunk) {
                cur += chunk.length
                if (total != 0){
                    percent = cur/total
                }
                if (percent - lastPercent > 0.01){
                    lastPercent = percent
                    io.emit("download_info", lastPercent)
                }    
            });

            req.on('end', function() {
                //console.log("say something")
                io.emit("download_info", lastPercent)
                io.emit("download_complete", 1)
                percent = 1
            });
            
            req.on( 'response', function (data) {
                total = data.headers[ 'content-length' ];
                console.log("response:", data.headers[ 'content-length' ] );
            });

            req.on('error', function (err){
                console.log(err)
            })
        });
        
        console.log("user connected");
    })
}

