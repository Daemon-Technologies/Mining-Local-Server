import express from "express"
import bodyParser from "body-parser"
import { getNodeStatus, shutDownNode, startNode } from "./src/rpc.js"
import { createWebsocketChannel } from './src/websocket.js'
import { createServer } from "http";
import { aes256Decrypt, keyGen } from './utils/key.js'


const app = express()
const clientApp = express()
const port_localServer = 5000
const port_client = 8000
let httpServer = createServer(app) 

//console.log(process.argv)
let password;// = "12345678" //default password
password = `${process.argv[3] || process.argv[2]}`
//password = undefined
//console.log(password, "undefined",typeof("undefined"), "undefined".length, typeof(password), typeof(password) == "undefined")
if (password == "undefined") password = "12345678"
console.log(password)
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
    let body = req.body;
    let rseed = await aes256Decrypt(body.seed.seedEnc, keyGen(password), body.seed.iv, body.seed.authTag)
    let rburnchain = await aes256Decrypt(body.burnchainInfo.infoEnc, keyGen(password), body.burnchainInfo.iv, body.burnchainInfo.authTag)
    
    //console.log("response:", rseed, rburnchain)
    /*
    {
      address: 'mhQcXvMokx2HRb4zKhe8qDR5SQEft48VMX',
      burn_fee_cap: 20000,
      debugMode: true,
      network: 'Krypton',
      burnchainInfo: {
        password: 'blockstacksystem',
        peerHost: 'bitcoind.xenon.blockstack.org',
        peerPort: 18333,
        rpcPort: 18332,
        username: 'blockstack'
      },
      seed: {
        authTag: 'ec1863a1513c736d1e7c3adceebebd46',
        iv: 'c54bd149288ea99193b303a75c8dbb53',
        seedEnc: 'DYhFz1/+VijXFSAqFD7SNaLYO/oWgvqzRtH/wQW1zr3F29cmFGactu5Q2iMJbNQNt6I+SGuafHcb2hh+QsXyTewK'
      }
    }
    */
    
    if (rseed && rburnchain && body.address && body.burn_fee_cap && body.debugMode!== undefined 
          && body.network && body.burnchainInfo){
        let t = await startNode(body, rseed, JSON.parse(rburnchain))
        console.log("res:", t)
        res.send(t)
    }
    else{
        res.send({status: 500, data: "param error"})
    }
})

app.post('/stopMining', async (req, res)=>{
    let body = req.body;
    let t = await shutDownNode(body.network);
    console.log(t)
    res.send(t)
})

app.post('/getNodeStatus',  async (req, res)=> {
    let body = req.body;
    let t = await getNodeStatus(body.network)
    console.log(t)
    res.send(t)
})

app.post('/isValidAuthCode', async(req, res)=> {
  /*
  {
    authTag: 'ec1863a1513c736d1e7c3adceebebd46',
    iv: 'c54bd149288ea99193b303a75c8dbb53',
    pingEnc: 'DYhFz1/+VijXFSAqFD7SNaLYO/oWgvqzRtH/wQW1zr3F29cmFGactu5Q2iMJbNQNt6I+SGuafHcb2hh+QsXyTewK'
  }
  */
  let body = req.body;
  let r = await aes256Decrypt(body.pingEnc, keyGen(password), body.iv, body.authTag)
  console.log("response:", r)
  if (r === 'ping') res.send({status: 200 , msg: "pong"})
  else res.send({status: 500})  
})

httpServer.listen(port_localServer, () => {
    console.log(`Local Server listening at http://localhost:${port_localServer}`)
})

clientApp.listen(port_client, () => {
    console.log(`Mining-Bot Client listening at http://localhost:${port_client}`)
})
clientApp.use(express.static('dist'));

clientApp.get('/*', function (req, res) {
  res.sendFile('dist/index.html', { root: '.' });
});

createWebsocketChannel(httpServer)