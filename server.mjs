import { createServer } from "http";
import crypto from "crypto";

const PORT = 8000;
const MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const SEVEN_BITS_INTEGER_MARKER = 125;
const SIXTEEN_BITS_INTEGER_MARKER = 126;
const SIXTYFOUR_BITS_INTEGER_MARKER = 127;

const FIRST_BIT = 128;
const MASK_KEY_BYTES_INDICATOR = 4;
const OPCODE_TEXT = 0x1;

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
  console.log(`${webClientSocketKey} websocket connected!`);

  const response_headers = createHandshakeResponse(webClientSocketKey);
  socket.write(response_headers);

  socket.on("readable", () => onSocketReadable(socket));
}

function onSocketReadable(socket) {
  socket.read(1);

  const [MARKER_AND_PAYLOAD_LENGTH] = socket.read(1);
  const length_indicator = MARKER_AND_PAYLOAD_LENGTH - FIRST_BIT;

  let messageLength = 0;
  if (length_indicator <= SEVEN_BITS_INTEGER_MARKER) {
    messageLength = length_indicator;
  } else if (length_indicator === SIXTEEN_BITS_INTEGER_MARKER) {
    messageLength = socket.read(2).readUint16BE(0);
  } else {
    messageLength = socket.read(8).readUint64BE(0);
  }

  const mask_key = socket.read(MASK_KEY_BYTES_INDICATOR);
  const encoded = socket.read(messageLength);

  console.log("decoding data...");
  const decoded = decodeMessage(encoded, mask_key);
  const stringDecoded = decoded.toString("utf8");
  const data = JSON.parse(stringDecoded);

  console.log("message recieved!", data);

  const msg = JSON.stringify({
    message: data,
    at: new Date().toISOString(),
  });
  sendMessage(msg, socket);
}

function decodeMessage(encoded, mask_key) {
  const finalBuffer = Buffer.from(encoded);

  for (let index = 0; index < encoded.length; index++) {
    finalBuffer[index] = encoded[index] ^ mask_key[index % 4];
  }

  return finalBuffer;
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

function sendMessage(message, socket) {
  const data = prepareMessage(message);
  return socket.write(data);
}

function prepareMessage(message) {
  const msgBuff = Buffer.from(message);
  const msgLength = msgBuff.length;

  const firstByte = 0x80 | OPCODE_TEXT;

  let dataframeHeaderBuffer;

  if (msgLength <= SEVEN_BITS_INTEGER_MARKER) {
    // One-byte payload length
    dataframeHeaderBuffer = Buffer.from([firstByte, msgLength]);
  } else if (msgLength <= 0xffff) {
    // 2-byte extended payload
    dataframeHeaderBuffer = Buffer.alloc(4);
    dataframeHeaderBuffer[0] = firstByte;
    dataframeHeaderBuffer[1] = SIXTEEN_BITS_INTEGER_MARKER;
    dataframeHeaderBuffer.writeUInt16BE(msgLength, 2);
  } else {
    // 8-byte extended payload
    dataframeHeaderBuffer = Buffer.alloc(10);
    dataframeHeaderBuffer[0] = firstByte;
    dataframeHeaderBuffer[1] = SIXTYFOUR_BITS_INTEGER_MARKER;
    dataframeHeaderBuffer.writeBigUInt64BE(BigInt(msgLength), 2);
  }

  const totalLength = dataframeHeaderBuffer.length + msgBuff.length;
  const finalResp = Buffer.concat([dataframeHeaderBuffer, msgBuff], totalLength);

  return finalResp;
}

function concat(totalBuff, totalLength) {
  const finalResp = Buffer.allocUnsafe(totalLength);
  let offset = 0;
  for (const buffer of totalBuff) {
    buffer.copy(finalResp, offset);
    offset += buffer.length;
  }
  return finalResp;
}

