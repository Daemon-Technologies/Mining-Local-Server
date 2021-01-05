import express from "express"
import bodyParser from "body-parser"
import { getNodeStatus, shutDownNode, startNode } from "./src/rpc.js"
import { createWebsocketChannel } from './src/websocket.js'
import { createServer } from "http";


const app = express()
const clientApp = express()
const port = 5000
let httpServer = createServer(app) 

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

clientApp.all("*", function (req, res, next) {
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
})

app.get('/stopMining', async (req, res)=>{
    let t = await shutDownNode();
    console.log(t)
    res.send(t)
})

app.get('/getNodeStatus',  async (req, res)=> {
    let t = await getNodeStatus()
    console.log(t)
    res.send(t)
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

createWebsocketChannel(httpServer)