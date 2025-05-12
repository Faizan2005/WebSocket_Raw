import {createServer} from 'http'
import crypto from 'crypto'
const PORT = 8000
const MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

const server = createServer((req, res) => {
    res.writeHead(200)
    res.end('successfully received HTTP request')
})

server.listen(PORT, () => {
    console.log(`server listening to port ${PORT}`)
    console.log('http://localhost:8000')
})

server.on('upgrade', onSocketUpgrade)

function onSocketUpgrade(req, socket, head) {
    const {
        'Sec-WebSocket-Accept': webClientSocketKey
    } = req.headers


}








