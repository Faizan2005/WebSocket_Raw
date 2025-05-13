const messages = document.getElementById("messages");
const socket = new WebSocket("ws://localhost:8000");

socket.onopen = (event) => {
  console.log("WebSocket is connected...");
  const data = JSON.stringify({
    message: "Hello, firstName()! Your order number is: #int(1,100)",
    phoneNumber: "phoneNumber()",
    phoneVariation: "+90 int(300,399) int(100,999) int(10-99) int(10,99)",
    status: "enum(active, disabled)",
    name: {
      first: "firstName()",
      middle: "middleName()",
      last: "lastName()",
    },
  });

  const msgInterval = setInterval(() => {
    socket.send(data)}, 2000)
};

socket.onmessage = (msg) => {
  const message = msg.data
  console.log('I got a message!', message)
  messages.innerHTML += `<br/> ${message}`
};

socket.onclose = (event) => {
  console.log('WebSocket server disconnected')
};

socket.onerror = (error) => {
  console.error('WebSocket error', error)
};
