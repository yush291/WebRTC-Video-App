// Replace the WebSocket connection with socket.io
const socket = io("https://web-rtc-video-3i4bgj2tk-ramiths-projects-8937ea4c.vercel.app");

socket.on("connect", () => {
  console.log("Connected to signaling server via socket.io");
});

socket.on("signaling_message", (message) => {
  handleSignalingMessage(message);
});

socket.on("disconnect", () => {
  console.log("Disconnected from signaling server");
});

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

// Other existing functions like startPeerConnection(), createOffer(), createAnswer(), etc. remain unchanged

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
initializeLocalStream();
