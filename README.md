# Mining Local Server

## Instruction

By now, there is no RPC API implemented in *stacks-node* for mining module(like _Receive Mining Transaction_ or _Change Burn Fee In Every Mining Cycle_). So the *Mining Local Server* is released as a short term production before *Stacks 2.0 Mainnet*. It works as _Mining Intern Server_ and _System Command Executor_ between *stacks-node* and *Mining Bot Client*. 

## Feature

In detail, we use *Mining Local Server* to execute system command like :
```
    # Node Start
    stacks-node start --config="a.toml"

    # Node Shut Down
    kill {stacks-node PID}

    # Node Status
    ps -ax | grep stacks-node
```
Each system command corresponds to a RPC API. Mining Module of *Mining Bot Client* connects with *Mining Local Server* using API above.


## Getting Started

### Download and build *Mining-Local-Server*

The first step is to ensure that you have **nodejs** and **npm** environment.

```
$ node -v
14.8.0

$ npm -v
6.14.7
```

The second step is downloading and building from source.

```
$ git clone https://github.com/Daemon-Technologies/Mining-Local-Server.git
$ cd Mining-Local-Server
$ npm install
```

Then running Mining-Local-Server
```
$ npm start
```





