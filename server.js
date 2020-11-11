import express from "express"
import bodyParser from "body-parser"
import {getNodeStatus, shutDownNode, startNode} from "./nodeCommand.js"

const app = express()
const port = 5000

app.use(bodyParser.json());

app.get('/', (req, res) => {
    console.log(req.query)
    res.send({status: "local server is online"})
})

app.get('/startMining', async (req, res)=>{
    let t = await startNode()
    console.log("res:", t)
    res.send(t)
})

app.get('/stopMining', async (req, res)=>{
    let t = await shutDownNode();
    res.send(t)
})

app.get('/getNodeStatus',  async (req, res)=> {
    let t = await getNodeStatus()
    res.send(t)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
  
