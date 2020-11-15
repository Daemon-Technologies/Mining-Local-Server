import express from "express"
import bodyParser from "body-parser"
import {getNodeStatus, shutDownNode, startNode} from "./nodeCommand.js"

const app = express()
const port = 5000

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
    res.send(t)
    //console.log(t)
})

app.get('/getNodeStatus',  async (req, res)=> {
    let t = await getNodeStatus()
    res.send(t)
    //console.log(t)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
  
