import request from "request"
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