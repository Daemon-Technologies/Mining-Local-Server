import execa from "execa"

(async () => {
    // 将 child_process 的 stdout 输出到主进程的 stdout
    execa('echo', ['unicorns111']).stdout.pipe(process.stdout);    // unicorns111

    execa('stacks-node', ['start', '--config=./miner.toml']).stderr.pipe(process.stdout);                                   // unicorns222

})();


function originProcess(){
    // start node
    let start_node =  child_process.spawn('stacks-node', ['start', '--config=./miner.toml']);
 /*   
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
    */
}