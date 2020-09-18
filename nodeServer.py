from flask import Flask
from flask_cors import CORS
from sysCommand import getNodeProcess, startNode, shutDownNode

app = Flask(__name__)
CORS(app)

@app.route('/')
def hello_world():
    print("call")
    return 'Hello World!'

@app.route('/startMining')
def startMining():
    print("startMining")
    t = startNode()
    return "success" if t else "fail"

@app.route('/getNodeStatus')
def getNodeStatus():
    t = getNodeProcess()
    print("getNodeStatus", t )
    return str(t)

@app.route('/stopMining')
def stopMining():
    t = shutDownNode()
    print("stopMining", t)
    return "success" if t else "fail"

if __name__ == '__main__':
    app.run(debug=True)