const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const callButton = document.getElementById("call-button");
const muteButton = document.getElementById("mute-button");
const cameraButton = document.getElementById("camera-button");
const messageInput = document.getElementById("message-input");
const sendMessageButton = document.getElementById("send-message");
const chatBox = document.getElementById("chat-box");

let localStream;
let remoteStream = new MediaStream();
let peerConnection;
let dataChannel;
let socket;

const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Initialize WebSocket Connection
function initializeWebSocket() {
  socket = new WebSocket("wss://web-rtc-video-5ne5onvea-ramiths-projects-8937ea4c.vercel.app");

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

async function initializeLocalStream() {
  try {
    // Get the user's video and audio
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    console.log("Local stream initialized.");
  } catch (err) {
    console.error("Error accessing media devices:", err);
    alert("Could not access camera and microphone. Please check permissions.");
  }
}



// Handle Signaling Messages
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
    default:
      console.error("Unknown signaling message type:", message.type);
  }
}

function startPeerConnection() {
  // Initialize peer connection
  peerConnection = new RTCPeerConnection(peerConnectionConfig);

  // Add local stream tracks to peer connection
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(JSON.stringify({ type: "candidate", payload: event.candidate }));
    }
  };

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
    remoteVideo.srcObject = remoteStream;
  };

  // Setup Data Channel
  dataChannel = peerConnection.createDataChannel("chat");
  dataChannel.onmessage = (event) => {
    displayMessage("Remote: " + event.data);
  };

  createOffer();
}


// Create Offer
async function createOffer() {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: "offer", payload: offer }));
    console.log("Offer sent.");
  } catch (error) {
    console.error("Error creating offer:", error);
  }
}

// Handle Offer
async function handleOffer(offer) {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);

  // Add local stream tracks
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  // Setup ICE Candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(JSON.stringify({ type: "candidate", payload: event.candidate }));
    }
  };

  // Handle Remote Stream
  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
    remoteVideo.srcObject = remoteStream;
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  createAnswer();
}

// Create Answer
async function createAnswer() {
  try {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: "answer", payload: answer }));
    console.log("Answer sent.");
  } catch (error) {
    console.error("Error creating answer:", error);
  }
}

// Handle Answer
function handleAnswer(answer) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Handle ICE Candidate
function handleCandidate(candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Send Chat Message
sendMessageButton.onclick = () => {
  const message = messageInput.value.trim();
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(message);
    displayMessage("You: " + message);
    messageInput.value = "";
  } else {
    console.error("DataChannel is not open. Cannot send message.");
  }
};

// Display Chat Message
function displayMessage(message) {
  const p = document.createElement("p");
  p.textContent = message;
  chatBox.appendChild(p);
}

// Mute/Unmute Microphone
muteButton.onclick = () => {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  muteButton.textContent = audioTrack.enabled ? "Mute" : "Unmute";
};

// Toggle Camera
cameraButton.onclick = () => {
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  cameraButton.textContent = videoTrack.enabled ? "Turn Off Camera" : "Turn On Camera";
};

// Initialize App
initializeWebSocket();
initializeLocalStream();
