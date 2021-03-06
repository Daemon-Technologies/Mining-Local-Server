import fs from "fs"
import crypto from 'crypto'
import { selectSystem, selectArc } from './utils.js'
import constants from './constants.js'
import request from 'request'

let downloading = false;

export function checkStacksNodeExists(network){
    return new Promise(function(resolve){
        try{
            let stat = fs.statSync(`./stacks-node_${network}`).isFile()
           // console.log("success:", stat)
            if (downloading) resolve(2)
            else resolve(1)
        }
        catch(error){  
            console.log(`./stacks-node_${network} not found`)
            resolve(0)
        }
    })
}


export function getStacksNodeMD5(network){
    return new Promise(function(resolve){
        if (!checkStacksNodeExists(network)) resolve(false);
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



export async function checkStacksNodeMD5(network){
    let md5Result = await getStacksNodeMD5(network);
    let md5Standard = constants.stacksNodeXenonDarwin_MD5;
    let result = false;  
    let system = selectSystem();
    let arc = selectArc();
    switch (`${network}_${system}`){
        case "Xenon_darwin" :   md5Standard = constants.stacksNodeXenonDarwin_MD5;
                                break;
        case "Xenon_linux":     switch (arc){
                                    case "x64" :  md5Standard = constants.stacksNodeXenonLinux_x64_MD5;
                                                  break;
                                    case "arm" : md5Standard = constants.stacksNodeXenonLinux_arm64_MD5; 
                                                  break;
                                    case "arm64" : md5Standard = constants.stacksNodeXenonLinux_arm64_MD5;
                                                   break;
                                    default : console.log("no such arc:", arc); break;
                                }
                                break;
        case "Mainnet_darwin" :   md5Standard = constants.stacksNodeMainnetDarwin_MD5;
                                break;
        case "Mainnet_linux":     switch (arc){
                                    case "x64" :  md5Standard = constants.stacksNodeMainnetLinux_x64_MD5;
                                                  break;
                                    case "arm" : md5Standard = constants.stacksNodeMainnetLinux_arm64_MD5; 
                                                  break;
                                    case "arm64" : md5Standard = constants.stacksNodeMainnetLinux_arm64_MD5;
                                                   break;
                                    default : console.log("no such arc:", arc); break;
                                }
                                break;
        default: console.log("no such system:", `${network}_${system}`); break;
    }
    result = md5Result === md5Standard? true: false;
    return result;
}

export function deleteStacksNode(network){
    return new Promise(function(resolve){
        try {
            fs.unlinkSync(`./stacks-node_${network}`)
            //file removed
            resolve(true)
        } catch(err) {
            console.error("delete error:",err)
            resolve(false)
        } 
    })
}

export function replaceSegment(keyword, value ,strFile){
    const Verbose = true;
    let start = strFile.search(keyword)
    let end = start

    // not found keyword, return native strFile
    if (start == -1) return strFile

    while (end < strFile.length){
        if (strFile.charAt(end) == '\n') {
            end++
            break;
        }
        end++
    }
    if (Verbose) console.log(start, end)
    
    let injection = `${keyword} = ${value}\n`;
    if (Verbose) {
        console.log("injection before", strFile.slice(0, start))
        console.log("injection", injection)
        console.log("injection end", strFile.slice(end - strFile.length + 1))
        console.log(end, strFile.length)
    }
    let result = strFile.slice(0, start) + injection + strFile.slice(end, strFile.length) 

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
    return {status: 500, PID: -5, msg: `stacks-node_${network}, but no PID of stacks-node_${network} runs`}
}

function selectStacksNodeURL(network){
    let system = selectSystem()
    let arc = selectArc()
    let url = constants.stacksNodeXenonDarwin;
    switch (`${network}_${system}`){

        case "Xenon_darwin" :   url = constants.stacksNodeXenonDarwin;
                                break;
        case "Xenon_linux":     switch (arc){
                                    case "x64" :  url = constants.stacksNodeXenonLinux_x64;
                                                  break;
                                    case "arm" : url = constants.stacksNodeXenonLinux_arm64; 
                                                  break;
                                    case "arm64" : url = constants.stacksNodeXenonLinux_arm64
                                                   break;
                                    default : console.log("no such arc:", arc); break;
                                }
                                break;
        case "Mainnet_darwin" :   url = constants.stacksNodeMainnetDarwin;
                                break;
        case "Mainnet_linux":     switch (arc){
                                    case "x64" :  url = constants.stacksNodeMainnetLinux_x64;
                                                  break;
                                    case "arm" : url = constants.stacksNodeMainnetLinux_arm64; 
                                                  break;
                                    case "arm64" : url = constants.stacksNodeMainnetLinux_arm64
                                                   break;
                                    default : console.log("no such arc:", arc); break;
                                }
                                break;
        default: console.log("no such system:", `${network}_${system}`); break;
    }
    return url
}

export async function downloadStacksNode(network, io){
    let exists = await checkStacksNodeExists(network)
    console.log(exists)
    if (exists) {
        return;
    }
    
    let file_url = selectStacksNodeURL(network)
    console.log(file_url)
    let out = fs.createWriteStream(`stacks-node_${network}`)
    
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
        downloading = true;
    });

    req.on('end', function() {
        //console.log("say something")
        io.emit("download_info", lastPercent)
        io.emit("download_complete", 1)
        percent = 1
        downloading = false;
    });
    
    req.on( 'response', function (data) {
        total = data.headers[ 'content-length' ];
        console.log("response:", data.headers[ 'content-length' ] );
    });

    req.on('error', function (err){
        console.log(err)
    })
}