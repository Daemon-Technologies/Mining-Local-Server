import fs from "fs"
import crypto from 'crypto'
import { selectSystem } from './utils.js'
export function checkStacksNodeExists(){
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


export function getStacksNodeMD5(){
    return new Promise(function(resolve){
        if (!checkStacksNodeExists()) resolve(false);
        let rs = fs.createReadStream('./stacks-node');
        
        let hash = crypto.createHash('md5');
        rs.on('data', hash.update.bind(hash));
            rs.on('end', function () {
                let result = hash.digest('hex')
                //console.log("in here:", result);
                resolve(result);
            });   
        });
}

export async function checkStacksNodeMD5(){
    let md5Result = await getStacksNodeMD5()
    //console.log("md5Result:",md5Result)
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

export function deleteStacksNode(){
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

export function replaceSegment(keyword, value ,strFile){
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

export async function getMinerAddress(){
    let strFile = fs.readFileSync("./Miner.txt", 'utf-8');
    return strFile;
}

export async function isNodeStart(commands){
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
