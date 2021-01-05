import express from "express"
import bodyParser from "body-parser"
import { getNodeStatus, shutDownNode, startNode } from "./src/rpc.js"
import { createWebsocketChannel } from './src/websocket.js'
import { createServer } from "http";
import { aes256Decrypt, keyGen } from './utils/key.js'


const app = express()
const clientApp = express()
const port = 5000
let httpServer = createServer(app) 

console.log(process.argv)
const password = `${process.argv[3] || process.argv[2]}`
console.log(password)
console.log(keyGen(password))

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
    let r = await aes256Decrypt(req.body.seed.seedEnc, keyGen(password), req.body.seed.iv, req.body.seed.authTag)
    console.log("response:", r)
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
    console.log(body)
    if (r && body.address && body.burn_fee_cap && body.debugMode!== undefined 
          && body.network && body.burnchainInfo)
    {
        console.log("in")
        console.log(req.body)
        let r = await startNode(body, r)
        console.log("res:", r)
        res.send(r)
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

app.post('/getNodeStatus',  async (req, res)=> {
    let body = req.body;
    let t = await getNodeStatus(body)
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