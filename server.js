import express from "express"
import bodyParser from "body-parser"
import {getNodeStatus} from "./nodeCommand.js"

const app = express()
const port = 5000

app.use(bodyParser.json());

app.get('/', (req, res) => {
    console.log(req.query)
    res.send({status: "local server is online"})
})

app.post('/startMining', (req, res)=>{
    console.log(req.body)
})

app.post('/stopMining', (req, res)=>{
    console.log(req.body)
})

app.get('/getNodeStatus',  async (req, res)=> {
    let t = await getNodeStatus()
    console.log(`/getNodeStatus ${t}`)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
  
