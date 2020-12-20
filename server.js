import express from "express"
import bodyParser from "body-parser"
import { getNodeStatus, shutDownNode, startNode } from "./src/nodeCommand.js"
import { download } from './src/downloadBinary.js'

import { createServer } from "http";
import { Server } from "socket.io";

const app = express()
const clientApp = express()
const port = 5000

let httpServer = createServer(app) 
const io = new Server(httpServer, {})

import os from "os"
import fs from "fs"
import request from "request"
import {checkStacksNodeExists} from './utils/stacksNode.js'

function selectSystem(){
    console.log(os.platform())
    return os.platform()
}

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
            
            //console.log(percent);
        
        });

        req.on('end', function() {
            //console.log("say something")
            io.emit("download_info", lastPercent)
            io.emit("download_complete", 1)
            percent = 1
        });
        console.log(percent)
        
        req.on( 'response', function ( data ) {
            total = data.headers[ 'content-length' ];
            console.log("response:", data.headers[ 'content-length' ] );
        });

        req.on('error', function (err){
            console.log(err)
        })
    });
    console.log("user connected");
})


app.use(bodyParser.json());

app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", req.headers.origin || '*');
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);
    if (req.method == 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
})

app.get('/', (req, res) => {
    //console.log(req.query)
    res.send({status: "local server is online"})
})

app.post('/startMining', async (req, res)=>{
    if (req.body.seed != undefined){
        //console.log(req.body)
        let t = await startNode(req.body)
        console.log("res:", t)
        res.send(t)
    }
    else{
        res.send({status: 500, data: "param error"})
    }
    
    //
    //console.log("res:", t)
    
})

app.get('/stopMining', async (req, res)=>{
    let t = await shutDownNode();
    console.log(t)
    res.send(t)
    //console.log(t)
})

app.get('/getNodeStatus',  async (req, res)=> {
    let t = await getNodeStatus()
    console.log(t)
    res.send(t)
    //console.log(t)
})

app.get('/download', async (req, res)=>{
    let t = await download(io);
    //console.log(t)
    res.send(t)
    //console.log(t)
})

httpServer.listen(port, () => {
    console.log(`Local Server listening at http://localhost:${port}`)
})

clientApp.listen(8000, () => {
    console.log(`Mining-Bot Client listening at http://localhost:8000`)
})
clientApp.use(express.static('dist'));

clientApp.get('/*', function (req, res) {
  res.sendFile('dist/index.html', { root: '.' });
});
