from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello_world():
    print("call")
    return 'Hello World!'

@app.route('/startMining')
def startMining():
    print("startMining")
    return 'startMining!'

@app.route('/getNodeStatus')
def getNodeStatus():
    print("getNodeStatus")
    return 'getNodeStatus!'

@app.route('/stopMining')
def stopMining():
    print("stopMining")
    return 'stopMining!'

if __name__ == '__main__':
    app.run(debug=True)