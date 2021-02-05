import child_process from "child_process"
import fs, { readlink } from "fs"
import execa from "execa"
import { selectSystem } from '../utils/utils.js'
import { checkStacksNodeMD5, getStacksNodeMD5, checkStacksNodeExists, deleteStacksNode, replaceSegment, getMinerAddress, isNodeStart } from '../utils/stacksNode.js'
import { splitProcess } from '../utils/sysCommand.js'

function updateMinerToml(data){
    const {seed, burn_fee_cap, network, burnchainInfo} = data
    const Verbose = false;

    if (Verbose) console.log(seed, burn_fee_cap, network)
    let strFile;
    switch (network) {
        case "Krypton": strFile = fs.readFileSync("./conf/miner-Krypton.toml", 'utf-8');
                        break;
        case "Xenon": strFile = fs.readFileSync("./conf/miner-Xenon.toml", 'utf-8');
                      break;
        case "Mainnet": strFile = fs.readFileSync("./conf/miner-Mainnet.toml", 'utf-8');
                      break;
        default: strFile = fs.readFileSync("./conf/miner-Xenon.toml", 'utf-8');
                 break;
    }

    if (Verbose) console.log(data)
    // update node
    if (seed != undefined){
        if (Verbose) console.log("in")
        strFile = replaceSegment("seed", `\"${seed}\"`, strFile)
        strFile = replaceSegment("local_peer_seed", `\"${seed}\"`, strFile)
    }
    
    // update burnchain
    
    if (burn_fee_cap !== undefined)
        strFile = replaceSegment("burn_fee_cap", burn_fee_cap, strFile)
        
    if (burnchainInfo.password && burnchainInfo.peerHost && burnchainInfo.peerPort&&
        burnchainInfo.rpcPort && burnchainInfo.username ){
        //console.log(`\"${burnchainInfo.password}\"`)
        strFile = replaceSegment("password", `\"${burnchainInfo.password}\"`, strFile)
        //console.log("after password:", strFile)
        strFile = replaceSegment("peer_host", `\"${burnchainInfo.peerHost}\"`, strFile)
        //console.log("after peerHost:", strFile)
        strFile = replaceSegment("peer_port", `${burnchainInfo.peerPort}`, strFile)
        strFile = replaceSegment("rpc_port", `${burnchainInfo.rpcPort}`, strFile)
        strFile = replaceSegment("username", `\"${burnchainInfo.username}\"`, strFile)
    }

    switch (network) {
        case "Krypton": fs.writeFileSync("./conf/miner-Krypton.toml", strFile , 'utf-8')
                        break;
        case "Xenon": fs.writeFileSync("./conf/miner-Xenon.toml", strFile , 'utf-8')
                      break;
        case "Mainnet": fs.writeFileSync("./conf/miner-Mainnet.toml", strFile , 'utf-8')
                      break;
        default: fs.writeFileSync("./conf/miner-Krypton.toml", strFile , 'utf-8')
                 break;
    }
    if (Verbose) console.log("final toml is :", strFile)
}


/* nodeStatus 
    -1 no Mining-Local-Server Started
    -2 Got Mining-Local-Server, but no stacks-node found
    -3 Found stacks-node, but stacks-node is incomplete. Will delete it, delete successfully.
    -4 Found stacks-node, but stacks-node is incomplete. Will delete it, delete unsuccessfully, please do it manually.
    -5 Found stacks-node, but no PID of stacks-node runs
    -6 stacks-node is downloading, please wait.
    else PID nodeStatus is running.
*/

export async function getNodeStatus(network){
    console.log(network)
    const Verbose = false
    //Check node exists
    let exists = await checkStacksNodeExists(network)
        // Check stacks-node exists
    switch (await checkStacksNodeExists(network)){
        case 0: console.log("Node doesn't exist!"); return {status: 500, PID: -2, msg: `Got Mining-Local-Server, but no stacks-node_${network} found`} ;
        case 1: break;
        case 2: return { status : 200, PID: -6 , data : "stacks-node is downloading, please wait."} ;
    }

    console.log(`stacks-node_${network} found`)

    //Check node md5
    let md5_status  = await checkStacksNodeMD5(network)
    console.log(md5_status)
    if (!md5_status){
        console.log("file md5 is wrong, deleting")
        let deleteResult = await deleteStacksNode(network)
        if (deleteResult){
            return { status : 500, PID: -3 , msg: `Found stacks-node_${network}, but stacks-node_${network} is incomplete. Will delete it, delete successfully.`}
        }
        else{
            return { status : 500, PID: -4 , msg: `Found stacks-node_${network}, but stacks-node_${network} is incomplete. Will delete it, delete unsuccessfully.`}
        }
        
    }
    console.log(`stacks-node_${network} is complete`)

    //Get Node Status
    const { stdout, stderr } = child_process.exec(`ps -ax | grep stacks-node_${network}`, { shell: true });
    for await (const data of stdout) {
        if (Verbose) console.log(`stdout: ${stdout}`)
        if (Verbose) console.log(`stdout from the child: \n ${data}`);
        let commands = splitProcess(data)
        if (Verbose) console.log(isNodeStart(commands, network))
        return isNodeStart(commands, network)
    };
    return {status: 500, PID: -5, msg: "Found stacks-node, but no PID of stacks-node runs"}
}

export async function shutDownNode(network){
    const Verbose = false
    const {status, PID} = await getNodeStatus(network)
    let currentPID = PID
    if (PID <= 0) return { status: 404, data: "No Mining Program is Running Now!" }
    while (currentPID > 0){
        if (Verbose) console.log(status, PID)
        const { stdout, stderr } = child_process.exec(`kill -9 ${currentPID}`, { shell: true });
        const {status, PID} = await getNodeStatus(network)
        currentPID = PID
    }
    



    return { status: 200, data: `kill mining node successfully` }
}

export async function isValidAuthCode(data){
    /*
    {
        authTag: 'ec1863a1513c736d1e7c3adceebebd46',
        iv: 'c54bd149288ea99193b303a75c8dbb53',
        pingEnc: 'DYhFz1/+VijXFSAqFD7SNaLYO/oWgvqzRtH/wQW1zr3F29cmFGactu5Q2iMJbNQNt6I+SGuafHcb2hh+QsXyTewK'
    }
    */

}


export async function startNode(data, seed, burnchainInfo){
    /*
        {
            address: 'mhQcXvMokx2HRb4zKhe8qDR5SQEft48VMX',
            burn_fee_cap: 20000,
            sats_per_bytes: 50,
            debugMode: true,
            network: 'Krypton',
            burnchainInfo:{
                "password": "blockstacksystem",
                "peerHost": "bitcoind.xenon.blockstack.org",
                "peerPort": 18333,
                "rpcPort": 18332,
                "username": "blockstack"
            },
        }
    */
    const { burn_fee_cap, network, address, debugMode, sats_per_bytes } = data
    
    const Verbose = true

    // Check stacks-node exists
    switch (await checkStacksNodeExists(network)){
        case 0: return { status : 404, data : "stacks-node doesn't exist, please download it"} ;
        case 1: break;  //Normal situation, go on.
        case 2: return { status : 406, data : "stacks-node is downloading, please wait."} ;
    }
        

    // Check stacks-node md5
    let md5_status = checkStacksNodeMD5(network)
    
    if (!md5_status){
        let deleteResult = await deleteStacksNode(network)
        if (deleteResult)
            return { status : 401, data : "Stacks-node doesn't complete, please re-download it"}
        else
            return { status : 402, data : "Stacks-node doesn't complete, but there is some issue when deleting it. Please delete manually, it is in the folder of Mining-Local-Server."}  
    }
    


    // Check node status
    const {status, PID} = await getNodeStatus(network)
    console.log(status, PID)

    if (PID > 0)
        return { status: 500, data: "Mining program already exists!" }
    
    // Modify configuration file

    if (Verbose) console.log(seed, burn_fee_cap, network)
    data.seed = seed
    data.burnchainInfo = burnchainInfo
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
    //let rpcResult = await importaddressRPC(address)
    //console.log(rpcResult)
    
    // Start Node
    let bin = `stacks-node_${network}`
    try {
        switch (network) {
            case "Krypton": fs.chmodSync(bin,'0777')
                            if (debugMode)
                                execa.command(`RUST_BACKTRACE=full STACKS_LOG_DEBUG=1 ./${bin} start --config=./conf/miner-${network}.toml 2>&1 | tee miner.log `, { shell: true }).stdout.pipe(process.stdout);
                            else
                                execa.command(`./${bin} start --config=./conf/miner-${network}.toml 2>&1 | tee miner.log`, { shell: true }).stdout.pipe(process.stdout);
                            break;
            case "Xenon":   fs.chmodSync(bin,'0777')
                            console.log("in")
                            if (debugMode)
                                execa.command(`RUST_BACKTRACE=full STACKS_LOG_DEBUG=1 ./${bin} start --config=./conf/miner-${network}.toml 2>&1 | tee miner.log `, { shell: true }).stdout.pipe(process.stdout);
                            else{
                                execa.command(`./${bin} start --config=./conf/miner-${network}.toml 2>&1 | tee miner.log`, { shell: true }).stdout.pipe(process.stdout);
                            }
                            break;
            case "Mainnet": fs.chmodSync(bin,'0777')
                            if (debugMode)
                                execa.command(`RUST_BACKTRACE=full STACKS_LOG_DEBUG=1 ./${bin} start --config=./conf/miner-${network}.toml 2>&1 | tee miner.log `, { shell: true }).stdout.pipe(process.stdout);
                            else{
                                execa.command(`./${bin} start --config=./conf/miner-${network}.toml 2>&1 | tee miner.log`, { shell: true }).stdout.pipe(process.stdout);
                            }
                            break;

            default:        execa.command(`./${bin} start --config=./conf/miner-${network}.toml 2>&1 | tee miner.log`, { shell: true }).stdout.pipe(process.stdout);

                            break;
        }
    } catch(error){
        console.log(error)
        return { status : 403, data : "execute stacks-node error"}  
    }
    // Update Miner Info
    fs.writeFileSync("Miner.txt", address , 'utf-8')

    return { status: 200, data: "Mining Program has been Launched! You can check the LOG info of stacks-node." }
}

