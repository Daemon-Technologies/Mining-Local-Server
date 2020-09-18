import subprocess
import time
def isRunning(t):
    StartCmd = ["mining-bot", "start", "--config=./miner.toml"]
    if len(t) > 3:
        print(t[-3 :])
        return StartCmd == t[-3 :]
    else:
        return False


def getNodeProcess():
    cmd = "ps -ax | grep mining-bot > nodeStatus.txt"
    t =  subprocess.call(cmd, shell=True)
    f = open('nodeStatus.txt', 'r')
    data = []
    count = 0
    while True:
        line = f.readline()
        if not line:
            break
        else:
            #print("new:",count)
            curLine=line.strip().split(" ")
            data.append(curLine)
            #print(curLine)

        #print(data[count],len(data[count]))
        if isRunning(data[count]):
            return data[count][0]
        count = count + 1
    #print(t)

    return 0

def startNode():
    t = getNodeProcess()
    if not t:
        cmd = "mining-bot start --config=./miner.toml"
        print("in")
        sr =  subprocess.Popen(cmd, shell=True)
        time.sleep(5)
        return True
    return False

def shutDownNode():
    t = getNodeProcess()
    if t :
        cmd = "kill -9 {}".format(t)
        print(cmd)
        subprocess.call(cmd, shell=True)
        return True
    return False


if __name__ == '__main__':
    t = getNodeProcess()
    print(t)
    t = shutDownNode()
    print(t)