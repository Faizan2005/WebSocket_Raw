const messages = document.getElementById("messages")
const socket = new WebSocket("ws://localhost:8000")

socket.onopen = (event) => {
    
}



socket.onmessage = (msg) => {}
socket.onclose = (event) => {}
socket.onerror = (error) => {}