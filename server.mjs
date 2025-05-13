import { createServer } from "http";
import crypto from "crypto";

const PORT = 8000;
const MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const server = createServer((req, res) => {
  res.writeHead(200);
  res.end("successfully received HTTP request");
});

server.listen(PORT, () => {
  console.log(`server listening to port ${PORT}`);
  console.log("http://localhost:8000");
});

server.on("upgrade", onSocketUpgrade);

function onSocketUpgrade(req, socket, head) {
  const { "sec-websocket-key": webClientSocketKey } = req.headers;
  console.log(`${webClientSocketKey} connected!`);

  const response_headers = createHandshakeResponse(webClientSocketKey);
  socket.write(response_headers);

  // Fix: use 'data' instead of 'readable' to read incoming frames
  socket.on("data", (buffer) => {
    console.log("Received data:", buffer);

    const message = decodeMessage(buffer);
    console.log("Decoded message from client:", message);

    // Fix: write a properly framed WebSocket message
    const framed = encodeMessage("Hi from server!");
    socket.write(framed);
  });
}

function createHandshakeResponse(socket_key) {
  const webSocket_accept = createSocketAccept(socket_key);

  const response_headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${webSocket_accept}`,
    "",
  ];

  return response_headers.join("\r\n") + "\r\n";
}

function createSocketAccept(socket_key) {
  const shaum = crypto.createHash("sha1");
  shaum.update(socket_key + MAGIC_STRING);
  return shaum.digest("base64");
}

// Minimal WebSocket message encoder (text-only, <126 bytes)
function encodeMessage(str) {
  const payload = Buffer.from(str);
  const frame = Buffer.alloc(2 + payload.length);
  frame[0] = 0x81; // text frame + FIN
  frame[1] = payload.length; // assuming length < 126
  payload.copy(frame, 2);
  return frame;
}

// Minimal WebSocket frame decoder (text-only, masked, <126 bytes)
function decodeMessage(buffer) {
  const length = buffer[1] & 0x7f;
  const mask = buffer.slice(2, 6);
  const data = buffer.slice(6, 6 + length);

  const unmasked = Buffer.alloc(length);
  for (let i = 0; i < length; i++) {
    unmasked[i] = data[i] ^ mask[i % 4];
  }

  return unmasked.toString();
}
