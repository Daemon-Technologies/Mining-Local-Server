import child_process from "child_process"

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
    return {status: false}
}


export async function getNodeStatus(){
    const { stdout, stderr } = child_process.exec('ps -ax | grep stacks-node', { shell: true });
    let a = false
    for await (const data of stdout) {
        console.log(`stdout: ${stdout}`)
        console.log(`stdout from the child: \n ${data}`);
        let commands = splitProcess(data)
        console.log(isNodeStart(commands))
        a = true
    };
    console.log(a)
    return a
}

export async function shutDownNode(){
    
}

export async function startNode(){
    const { stdout, stderr } = child_process.exec('stacks-node start --config=./miner.toml', { shell: true });
    for await (const data of stdout) {
        console.log(`stdout from the child: ${data}`);
        a = true
    };
}