//https://github.com/tyGavinZJU/mining-program/releases/download/1.0.0/stacks-node

import fs from "fs"
import request from "request"
import os from "os"




function selectSystem(){
    console.log(os.platform())
    return os.platform()
}

export function download(){

    let system = selectSystem()
    let out = fs.createWriteStream('stacks-node')
    let file_url = 'https://github.com/tyGavinZJU/mining-program/releases/download/1.0.0/stacks-node'
    let req = request({
        method: 'GET',
        uri: file_url
    })
    let cur = 0;
    let total = 0;
    let percent = 0;
    req.pipe(out);

    req.on('data', function (chunk) {
        cur += chunk.length
        if (total != 0){
            percent = cur/total
        }
        console.log(percent);
    
    });

    req.on('end', function() {
        console.log("say something")
        percent = 1
    });

    console.log(percent)
    

    req.on( 'response', function ( data ) {
        total = data.headers[ 'content-length' ];
        console.log("response:", data.headers[ 'content-length' ] );
    });

    
}