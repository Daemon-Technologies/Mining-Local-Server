# Mining Local Server

- [English Version](./README.md)

## 介绍

现阶段为止，*stacks-node*并没有支持挖矿模块相关的RPC-API（像 _接受挖矿交易_ 或 _在每个挖矿周期修改燃烧量_)。 所以 *Mining Local Server*是为了在*Stacks 2.0 主网*上线前，方便社区快速参与挖矿而发布出来的一个短期的产品。*Mining Local Server* 是 *stacks-node* 与 *Mining Bot Client*中间进行衔接的组件，主要用来做 _本地挖矿服务衔接_ 与 _系统命令执行_ 的功能。


## 特性

详细来说，我们使用 *Mining Local Server* 来执行系统命令，就像：

```
    # stacks-node 节点启动
    $ stacks-node start --config="a.toml"

    # 节点关闭
    $ kill {stacks-node PID}

    # 查看节点状态
    $ ps -ax | grep stacks-node
```

上述每一种系统命令都会对应一个RPC API。*挖矿机器人客户端* 与 *Mining Local Server*就是通过上述的API进行连接通讯的。

## 开始使用

### 下载并安装 *Mining-Local-Server*


第一步是确保计算机有**nodejs** 与 **npm** 环境。

```
$ node -v
14.8.0

$ npm -v
6.14.7
```

第二步是从源代码处下载并且安装*Mining-Local-Server*

```
$ git clone https://github.com/Daemon-Technologies/Mining-Local-Server.git
$ cd Mining-Local-Server
$ npm install
```

接着就可以开始运行 *Mining-Local-Server* 了
```
$ npm start
```

如果你看到类似如下输出则代表已成功启动：

```shell
> miningbot-server@1.0.0 start D:\Projects\Blockstack\Mining-Local-Server
> node server.js

(node:4312) ExperimentalWarning: The ESM module loader is experimental.
Example app listening at http://localhost:5000
```




