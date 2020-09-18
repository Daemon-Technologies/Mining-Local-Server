import subprocess

def getNodeProcess():
    cmd = "ps -a | grep mining-bot > nodeStatus.txt"
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

        print(data[count],len(data[count]))
        count = count + 1
    print(t)

def shutDownNode():
    return True


if __name__ == '__main__':
    getNodeStatus()