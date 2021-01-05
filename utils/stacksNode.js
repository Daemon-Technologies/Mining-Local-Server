import fs from "fs"
import crypto from 'crypto'
import { selectSystem, selectArc } from './utils.js'
export function checkStacksNodeExists(network){
    return new Promise(function(resolve){
        try{
            let stat = fs.statSync(`./stacks-node_${network}`).isFile()
           // console.log("success:", stat)
            resolve(true)
        }
        catch(error){  
            console.log("no stacks-node found")
            resolve(false)
        }
    })
}


export function getStacksNodeMD5(network){
    return new Promise(function(resolve){
        if (!checkStacksNodeExists()) resolve(false);
        let rs = fs.createReadStream(`./stacks-node_${network}`);
        
        let hash = crypto.createHash('md5');
        rs.on('data', hash.update.bind(hash));
            rs.on('end', function () {
                let result = hash.digest('hex')
                //console.log("in here:", result);
                resolve(result);
            });   
        });
}

const darwin_md5_Krypton = "c93d51447dfd5a1c737dc1717117b933"
const linux_x64_md5_Krypton = "5557c6ebdfded15e3caef6e3dc7d4643"
const linux_armv7_md5_Krypton = "5557c6ebdfded15e3caef6e3dc7d4643"
const darwin_md5_Xenon = "c93d51447dfd5a1c737dc1717117b933"
const linux_x64_md5_Xenon = "5557c6ebdfded15e3caef6e3dc7d4643"
const linux_armv7_md5_Xenon = "5557c6ebdfded15e3caef6e3dc7d4643"


export async function checkStacksNodeMD5(network){
    //TODO 2021.1.5 network 切换
    let md5Result = await getStacksNodeMD5(network)
    //console.log("md5Result:",md5Result)
    let system = selectSystem()
    let arc = selectArc()

    switch (system){
        case 'darwin': if (md5Result != darwin_md5_krypton) 
                            return false;
                       break;
        case 'linux': if (md5Result != linux_x64_md5_krypton) 
                            return false;
                      break;
        default : return false;
    }
    return true;
}

export function deleteStacksNode(network){
    return new Promise(function(resolve){
        try {
            fs.unlinkSync(`./stacks-node_${network}`)
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

export async function isNodeStart(commands, network){
    const Verbose = false;
    const key_word = `stacks-node_${network} start`
    
    let address = await getMinerAddress()

    for (let index in commands){
        if (Verbose) console.log(commands[index].CMD.search(key_word))
        if (commands[index].CMD.search(key_word) != -1)
            return {status: true, PID: commands[index].PID, address: address}
    }
    return {status: 500, PID: -5}
}

export async function downloadStacksNode(network){
    let exists = await checkStacksNodeExists()
    console.log(exists)
    if (exists) {
        return;
    }
    let system = selectSystem()
    let file_url = 'https://github.com/Daemon-Technologies/Mining-Bot/releases/download/1.0.0/stacks-node-'
    switch (system){
        case "darwin": file_url+="mac"
                    break;
        case "linux":  file_url+=system
                    break;
        case "default": return "Do not support other system except Darwin and linux";
    }
    let out = fs.createWriteStream('stacks-node')
    
    let req = request({
        method: 'GET',
        uri: file_url
    })
    let cur = 0;
    let total = 0;
    let percent = 0;
    let lastPercent = 0;
    req.pipe(out);

    req.on('data', function (chunk) {
        cur += chunk.length
        if (total != 0){
            percent = cur/total
        }
        if (percent - lastPercent > 0.01){
            lastPercent = percent
            io.emit("download_info", lastPercent)
        }    
    });

    req.on('end', function() {
        //console.log("say something")
        io.emit("download_info", lastPercent)
        io.emit("download_complete", 1)
        percent = 1
    });
    
    req.on( 'response', function (data) {
        total = data.headers[ 'content-length' ];
        console.log("response:", data.headers[ 'content-length' ] );
    });

    req.on('error', function (err){
        console.log(err)
    })
}