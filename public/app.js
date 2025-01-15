const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const callButton = document.getElementById("call-button");
const muteButton = document.getElementById("mute-button");
const cameraButton = document.getElementById("camera-button");
const messageInput = document.getElementById("message-input");
const sendMessageButton = document.getElementById("send-message");

let localStream;
let remoteStream;
let peerConnection;
let dataChannel;
let socket;
let isReadyForConnection = false;
let otherUserReady = false;

const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function initializeLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    console.log("Local stream initialized");
  } catch (err) {
    console.error("Error accessing media devices:", err);
    alert("Could not access camera and microphone. Please check permissions.");
  }
}

initializeLocalStream();

function initializeWebSocket() {
  socket = new WebSocket("wss://your-vercel-deployment-url/api/signaling");

  socket.onopen = () => {
    console.log("Connected to signaling server");
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleSignalingMessage(message);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function handleSignalingMessage(message) {
  switch (message.type) {
    case "offer":
      handleOffer(message.payload);
      break;
    case "answer":
      handleAnswer(message.payload);
      break;
    case "candidate":
      handleCandidate(message.payload);
      break;
  }
}

callButton.onclick = () => {
  isReadyForConnection = true;
  callButton.style.display = "none";
  checkForOtherUserReady();
};

function checkForOtherUserReady() {
  if (otherUserReady) {
    startPeerConnection();
  }
}

function startPeerConnection() {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendCandidate(event.candidate);
    }
  };

  peerConnection.ontrack = (event) => {
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  dataChannel = peerConnection.createDataChannel("chat");

  dataChannel.onmessage = (event) => {
    displayMessage(event.data);
  };

  createOffer();
}

async function createOffer() {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    sendOffer(offer);
  } catch (error) {
    console.error("Error creating offer:", error);
  }
}

function sendOffer(offer) {
  socket.send(JSON.stringify({ type: "offer", payload: { offer } }));
}

function handleOffer(offer) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  createAnswer();
}

async function createAnswer() {
  try {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    sendAnswer(answer);
  } catch (error) {
    console.error("Error creating answer:", error);
  }
}

function sendAnswer(answer) {
  socket.send(JSON.stringify({ type: "answer", payload: { answer } }));
}

function handleAnswer(answer) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function sendCandidate(candidate) {
  socket.send(JSON.stringify({ type: "candidate", payload: { candidate } }));
}

function handleCandidate(candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function sendMessage() {
  const message = messageInput.value;
  dataChannel.send(message);
  displayMessage("You: " + message);
  messageInput.value = "";
}

function displayMessage(message) {
  const chatBox = document.getElementById("chat-box");
  const p = document.createElement("p");
  p.textContent = message;
  chatBox.appendChild(p);
}

muteButton.onclick = () => {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  muteButton.textContent = audioTrack.enabled ? "Mute" : "Unmute";
};

cameraButton.onclick = () => {
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  cameraButton.textContent = videoTrack.enabled ? "Turn Off Camera" : "Turn On Camera";
};

sendMessageButton.onclick = () => {
  const message = messageInput.value.trim();
  if (message && dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(message);
    displayMessage("You: " + message);
    messageInput.value = "";
  } else if (!dataChannel || dataChannel.readyState !== "open") {
    console.error("DataChannel is not open. Cannot send message.");
    alert("Connection not established. Please start a call first.");
  }
};

callButton.onclick = () => {
  startPeerConnection();
  console.log("Call started");
};

