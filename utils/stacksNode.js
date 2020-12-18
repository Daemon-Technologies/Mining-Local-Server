import fs from "fs"

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