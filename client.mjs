const messages = document.getElementById("messages");
const socket = new WebSocket("ws://localhost:8000");

socket.onopen = (event) => {
  console.log("WebSocket is connected...");
  const data = JSON.stringify({
    type: "chat",
    user: "Alice",
    message:
      "Hello Bob! This is a test message that fills exactly 125 bytes including keys and punctuation.",
  });

  const msgInterval = setInterval(() => {
    socket.send(data);
  }, 2000);
};

socket.onmessage = (msg) => {
  const message = msg.data;
  console.log("I got a message!", message);
  messages.innerHTML += `<br/> ${message}`;
};

socket.onclose = (event) => {
  console.log("WebSocket server disconnected");
};

socket.onerror = (error) => {
  console.error("WebSocket error", error);
};
