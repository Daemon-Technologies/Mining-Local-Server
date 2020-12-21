import os from "os"

export function selectSystem(){
    console.log(os.platform())
    return os.platform()
}