import child_process from "child_process"
import fs from "fs"

function splitProcess(commands){
    //PID TTY TIME CMD
    const Verbose = false;
    let result = []
    if (Verbose) console.log(typeof(commands))
    /*
    for (let i in commands){
        console.log(i, commands[i])
        if (commands[i] == '\n'){
            console.log("enter")
        }
        if (commands[i] == ' '){
            console.log("space")
        }
    }
    */
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

function isNodeStart(commands){
    const Verbose = false;
    const key_word = "stacks-node start"
    for (let index in commands){
        if (Verbose) console.log(commands[index].CMD.search(key_word))
        if (commands[index].CMD.search(key_word) != -1)
            return {status: true, PID: commands[index].PID}
    }
    return {status: false, PID: -1}
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
    const Verbose = false;
    let strFile = fs.readFileSync("./miner.toml", 'utf-8')
    if (Verbose) console.log(data)
    if (data.seed != undefined){
        if (Verbose) console.log("in")
        strFile = replaceSegment("seed", `\"${data.seed}\"`, strFile)
    }
        
    if (Verbose) console.log(strFile)
    if (data.burn_fee_cap != undefined)
        strFile = replaceSegment("burn_fee_cap", data.burn_fee_cap, strFile)
    fs.writeFileSync("./miner.toml", strFile , 'utf-8')
} 

export async function getNodeStatus(){
    const Verbose = false
    const { stdout, stderr } = child_process.exec('ps -ax | grep stacks-node', { shell: true });
    for await (const data of stdout) {
        if (Verbose) console.log(`stdout: ${stdout}`)
        if (Verbose) console.log(`stdout from the child: \n ${data}`);
        let commands = splitProcess(data)
        if (Verbose) console.log(isNodeStart(commands))
        let {status, PID} = isNodeStart(commands)
        return isNodeStart(commands)
    };
    return {status: false, PID: -1}
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
    const {status, PID} = await getNodeStatus()
    //console.log(status, PID)
    // check node status
    if (status)
        return { status: 500, data: "Mining program already exists!" }
    
    // modify configuration file
    updateMinerToml(data)

    // start node
    let start_node =  child_process.spawn('stacks-node', ['start', '--config=./miner.toml']);
    
    start_node.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
    });

    start_node.stderr.on('data', async function (data) { 
        console.log('LOG: ' + data.toString());
        if (data.toString().search("Node will fetch burnchain blocks") != -1){
            return { status: 200, data: "Mining Program Launched!" }
        }
    });

    start_node.on('exit', function (code) {
        console.log('stacks-node shutdown by system kill');
    });

    for await (const data of start_node.stdout) {
        //console.log('stacks-node stdout successfully: ' + data.toString());
        return { status: 200, data: "Mining Program is Launching!" }
    }
}