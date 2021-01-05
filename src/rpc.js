import child_process from "child_process"
import fs from "fs"
import execa from "execa"
import request from "request"
import { selectSystem} from '../utils/utils.js'
import { checkStacksNodeMD5, getStacksNodeMD5, checkStacksNodeExists, deleteStacksNode, replaceSegment, getMinerAddress, isNodeStart } from '../utils/stacksNode.js'
import { splitProcess } from '../utils/sysCommand.js'

function updateMinerToml(data){
    const {seed, burn_fee_cap, network} = data
    const Verbose = true;

    if (Verbose) console.log(seed, burn_fee_cap, network)
    let strFile;
    switch (network) {
        case "Krypton" | "krypton" : strFile = fs.readFileSync("./conf/miner-Krypton.toml", 'utf-8');
                        break;
        case "Xenon" | "xenon" : strFile = fs.readFileSync("./conf/miner-Xenon.toml", 'utf-8');
                      break;
        default: strFile = fs.readFileSync("./conf/miner-Krypton.toml", 'utf-8');
                 break;
    }

    if (Verbose) console.log(data)
    if (seed != undefined){
        if (Verbose) console.log("in")
        strFile = replaceSegment("seed", `\"${seed}\"`, strFile)
    }
        
    if (Verbose) console.log(strFile)
    if (burn_fee_cap != undefined)
        strFile = replaceSegment("burn_fee_cap", burn_fee_cap, strFile)

    switch (network) {
        case "Krypton" | "krypton": fs.writeFileSync("./conf/miner-Krypton.toml", strFile , 'utf-8')
                        break;
        case "Xenon" | "xenon": fs.writeFileSync("./conf/miner-Xenon.toml", strFile , 'utf-8')
                      break;
        default: fs.writeFileSync("./conf/miner-Krypton.toml", strFile , 'utf-8')
                 break;
    }
    
}


/* nodeStatus 
    -1 no Mining-Local-Server Started
    -2 Got Mining-Local-Server, but no stacks-node found
    -3 Found stacks-node, but stacks-node is incomplete. Will delete it, delete successfully.
    -4 Found stacks-node, but stacks-node is incomplete. Will delete it, delete unsuccessfully, please do it manually.
    -5 Found stacks-node, but no PID of stacks-node runs
    
    else PID nodeStatus is running.
*/

export async function getNodeStatus(){
    const Verbose = false
    //Check node exists
    let exists = await checkStacksNodeExists()
    if (!exists) {
        console.log("Node doesn't exist!")
        return {status: 500, PID: -2, msg: "Got Mining-Local-Server, but no stacks-node found"}
    }
    console.log("Stacks-node found")
    //Check node md5
    let md5_status  = await checkStacksNodeMD5()
    console.log(md5_status)
    if (!md5_status){
        console.log("file md5 is wrong, deleting")
        let deleteResult = await deleteStacksNode()
        if (deleteResult){
            return { status : 500, PID: -3 , msg:"Found stacks-node, but stacks-node is incomplete. Will delete it, delete successfully."}
        }
        else{
            return { status : 500, PID: -4 , msg:"Found stacks-node, but stacks-node is incomplete. Will delete it, delete unsuccessfully."}
        }
        
    }
    console.log("Stacks-node is complete")

    //Get Node Status
    const { stdout, stderr } = child_process.exec('ps -ax | grep stacks-node', { shell: true });
    for await (const data of stdout) {
        if (Verbose) console.log(`stdout: ${stdout}`)
        if (Verbose) console.log(`stdout from the child: \n ${data}`);
        let commands = splitProcess(data)
        if (Verbose) console.log(isNodeStart(commands))
        return isNodeStart(commands)
    };
    return {status: 500, PID: -5, msg: "Found stacks-node, but no PID of stacks-node runs"}
}

export async function shutDownNode(){
    const Verbose = false
    const {status, PID} = await getNodeStatus()
    if (Verbose) console.log(status, PID)
    if (!status) 
        return { status: 404, data: "No Mining Program is Running Now!" }
    const { stdout, stderr } = child_process.exec(`kill -9 ${PID}`, { shell: true });
    //console.log("stdout:", stdout)
    return { status: 200, data: `kill PID ${PID}` }
}

function importaddressRPC(address){
    return new Promise(function(resolve, reject){
        request.post('http://bitcoind.krypton.blockstack.org:18443', 
            {json:{"id":"stacks",
                "jsonrpc":"2.0",
                "method":"importaddress",
                "params":[ address, "testing" , false ]}}, function (err, response, body) {
                    if (err) {
                        reject(console.error('rpc call failed:', err));
                    }
                    console.log( "importaddress rpc call succeed, body is :", body);
                    console.log("sleep for 15 seconds to import address in bitcoin node")
                    setTimeout(function(){
                        resolve(body)
                    },15000)
                    
                })
    })
}

export async function startNode(data){

    //2021.1.3 support debug mode & 
    // const { seed, burn_fee_cap, network, address, debug } = data

    // Check Encrypted Message
    
    const Verbose = true

    // Check stacks-node exists
    if (!checkStacksNodeExists()) 
        return { status : 404, data : "stacks-node doesn't exist, please download it"}

    // Check stacks-node md5
    let md5_status = checkStacksNodeMD5()
    

    if (!md5_status){
        let deleteResult = await deleteStacksNode()
        if (deleteResult)
            return { status : 401, data : "Stacks-node doesn't complete, please re-download it"}
        else
            return { status : 402, data : "Stacks-node doesn't complete, but there is some issue when deleting it. Please delete manually, it is in the folder of Mining-Local-Server."}  
    }
    


    // Check node status
    const {status, PID} = await getNodeStatus()
    console.log(status, PID)

    if (PID > 0)
        return { status: 500, data: "Mining program already exists!" }
    
    // Modify configuration file
    const {seed, burn_fee_cap, network, address} = data

    if (Verbose) console.log(seed, burn_fee_cap, network)
    updateMinerToml(data)

    // Import Bitcoin Address to krypton bitcoin node
    // https://github.com/blockstack/stacks-blockchain/issues/2200
    /*
    curl -X "POST" "http://bitcoind.krypton.blockstack.org:18443" \
    -H 'Content-Type: application/json; charset=utf-8' \
    -d $'{
        "id":"stacks",
        "jsonrpc":"2.0",
        "method":"importaddress",
        "params":["<YOUR_ADDRESS>","testing",false]
    }'
    */
    let rpcResult = await importaddressRPC(address)
    console.log(rpcResult)
    
    // Start Node

    try {
        switch (network) {
            case "Krypton":{
                            let a = fs.chmodSync("./stacks-node",'0777')
                            execa('./stacks-node', ['start', '--config=./conf/miner-Krypton.toml']).stderr.pipe(process.stdout); 
                            break;}
            case "Xenon": execa('./stacks-node', ['start', '--config=./conf/miner-Xenon.toml']).stderr.pipe(process.stdout); 
                        break;
            default: execa('./stacks-node', ['start', '--config=./conf/miner-Krypton.toml']).stderr.pipe(process.stdout); 
                    break;
        }
    } catch(error){
        console.log(error)
    }
    // Update Miner Info
    fs.writeFileSync("Miner.txt", address , 'utf-8')

    return { status: 200, data: "Mining Program has been Launched! You can check the LOG info of stacks-node." }
}