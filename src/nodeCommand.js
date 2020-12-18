import child_process from "child_process"
import fs from "fs"
import execa from "execa"
import crypto from "crypto"
import os from "os"

function splitProcess(commands){
    //PID TTY TIME CMD
    const Verbose = false;
    let result = []
    if (Verbose) console.log(typeof(commands))

    let commandArray = commands.split('\n')
    if (Verbose) console.log(commandArray)
    for (let i in commandArray){
        let item = commandArray[i]
        if (item.length < 10) continue;
        // split header space
        let index = 0
        let command = {'PID': '', 'TTY':'' ,'TIME':'' ,'CMD':''}
        while (index < 4){
            if (Verbose) console.log(item, item.search(" "))
            if (item.search(" ") == 0){
                item = item.slice(1)
                if (Verbose) console.log(item)
                continue;
            }
            else{
                let nextPart = item.search(" ")
                let t = item.slice(0, nextPart)
                if (Verbose) console.log("Debug:",item, nextPart, t)                
                switch (index){
                    case 0 : command.PID = t; break;
                    case 1 : command.TTY = t; break;
                    case 2 : command.TIME = t; break;
                    case 3 : command.CMD = item; break;
                }
                item = item.slice(nextPart)
                if (Verbose) console.log("Debug After:",item, nextPart, t)
                index++;
                continue;
            }
        }
        result.push(command)
        if (Verbose) console.log(command)
        
    }
    return result
}

function replaceSegment(keyword, value ,strFile){
    const Verbose = false;
    let start = strFile.search(keyword)
    let end = start
    while (end <= strFile.length){
        if (strFile.charAt(end) == '\n')
            break;
        end++
    }
    if (Verbose) console.log(end, strFile[end])
    
    let injection = `${keyword} = ${value}\n`;
    if (Verbose) console.log("injection", injection)
    let result = strFile.slice(0, start) + injection + strFile.slice(end - strFile.length + 1) 

    return result
}

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

async function getMinerAddress(){
    let strFile = fs.readFileSync("./Miner.txt", 'utf-8');
    return strFile;
}

async function isNodeStart(commands){
    const Verbose = false;
    const key_word = "stacks-node start"
    
    let address = await getMinerAddress()

    for (let index in commands){
        if (Verbose) console.log(commands[index].CMD.search(key_word))
        if (commands[index].CMD.search(key_word) != -1)
            return {status: true, PID: commands[index].PID, address: address}
    }
    return {status: 500, PID: -5}
}



function selectSystem(){
    return os.platform()
}

function checkStacksNodeExists(){
    return new Promise(function(resolve){
        try{
            let stat = fs.statSync('./stacks-node').isFile()
           // console.log("success:", stat)
            resolve(true)
        }
        catch(error){  
            //console.log("no stacks-node found error:",error)
            resolve(false)
        }
    })
    
}

function getStacksNodeMD5(){
    
    return new Promise(function(resolve){
        if (!checkStacksNodeExists()) resolve(false);
        let rs = fs.createReadStream('./stacks-node');
        
        let hash = crypto.createHash('md5');
        rs.on('data', hash.update.bind(hash));
            rs.on('end', function () {
                let result = hash.digest('hex')
                console.log("in here:", result);
                resolve(result);
            });   
        });
}

async function checkStacksNodeMD5(){
    let md5Result = await getStacksNodeMD5()
    console.log("md5Result:",md5Result)
    let system = selectSystem()
    let darwin_md5 = "c93d51447dfd5a1c737dc1717117b933"
    let linux_md5 = "5557c6ebdfded15e3caef6e3dc7d4643"
    switch (system){
        case 'darwin': if (md5Result != darwin_md5) 
                            return false;
                       break;
        case 'linux': if (md5Result != linux_md5) 
                            return false;
                      break;
        default : return false;
    }
    return true;
}

function deleteStacksNode(){
    return new Promise(function(resolve){
        try {
            fs.unlinkSync('./stacks-node')
            //file removed
            resolve(true)
            //return { status : 401, data : "Stacks-node doesn't complete, please re-download it"}
        } catch(err) {
            console.error(err)
            resolve(false)
            //return { status : 402, data : "Stacks-node doesn't complete, but there is some issue when deleting it. Please delete manually, it is in the folder of Mining-Local-Server."}
        } 
    })
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

export async function startNode(data){
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
    

    // Check if node running
    const {status, PID} = await getNodeStatus()
    console.log(status, PID)
    // check node status
    if (PID > 0)
        return { status: 500, data: "Mining program already exists!" }
    
    // Modify configuration file
    const {seed, burn_fee_cap, network, address} = data

    if (Verbose) console.log(seed, burn_fee_cap, network)
    updateMinerToml(data)

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