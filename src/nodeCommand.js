import child_process from "child_process"
import fs from "fs"
import execa from "execa"
import crypto from "crypto"

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
    return {status: 500, PID: -3}
}

/* nodeStatus 
    -1 no Mining-Local-Server Started
    -2 Got Mining-Local-Server, but no stacks-node found
    -3 Found stacks-node, but no PID of stacks-node runs
    else PID nodeStatus is running.
*/

async function checkStacksNodeExists(){
    try{
        let stat = await fs.statSync('./stacks-node').isFile()
        console.log("success:", stat)
        return true
    }
    catch(error){  
        console.log("no stacks-node found error:",error)
        return false
    }
}

function checkStacksNodeMD5(){
    let rs = fs.createReadStream('./stacks-node');
    
    let hash = crypto.createHash('md5');
    rs.on('data', hash.update.bind(hash));
    
    return new Promise(function(resolve){
            rs.on('end', function () {
                let result = hash.digest('hex')
                console.log("in here:", result);
                resolve(result);
            });   
        });
}

export async function getNodeStatus(){
    const Verbose = false
    if (!checkStacksNodeExists) return {status: 500, PID: -2}

    const { stdout, stderr } = child_process.exec('ps -ax | grep stacks-node', { shell: true });
    let a  = await checkStacksNodeMD5()
    console.log("in there:", a)

    for await (const data of stdout) {
        if (Verbose) console.log(`stdout: ${stdout}`)
        if (Verbose) console.log(`stdout from the child: \n ${data}`);
        let commands = splitProcess(data)
        if (Verbose) console.log(isNodeStart(commands))
        return isNodeStart(commands)
    };
    return {status: 500, PID: -3}
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
    // check stacks-node md5

    


    const {seed, burn_fee_cap, network, address} = data

    if (Verbose) console.log(seed, burn_fee_cap, network)
    
    const {status, PID} = await getNodeStatus()
    console.log(status, PID)
    // check node status
    if (status)
        return { status: 500, data: "Mining program already exists!" }
    
    // modify configuration file
    updateMinerToml(data)
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
    }catch(error){
        console.log(error)
    }
    //
    fs.writeFileSync("Miner.txt", address , 'utf-8')

    return { status: 200, data: "Mining Program has been Launched! You can check the LOG info of stacks-node." }
}