import {createServer} from 'http'
const PORT = 8000

const server = createServer((req, res) => {
    res.writeHead(200)
    res.end('successfully received HTTP request')
})

server.listen(PORT, () => {
    console.log(`server listening to port ${PORT}`)
    console.log('http://localhost:8000')
})

