import os from "os"

export function selectSystem(){
    /*
    'aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', 'win32'
    */
    console.log(os.platform())
    return os.platform()
}

export function selectArc(){
    /*
    'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', 'x64'
    */
    console.log(os.arch())
    return os.arch()
}