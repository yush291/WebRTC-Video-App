// src/App.js
import React, { useState, useEffect } from 'react';

function App() {
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isReadyForConnection, setIsReadyForConnection] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    // Initialize the local stream when the component mounts
    async function initializeLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    }

    initializeLocalStream();
  }, []);

  const startPeerConnection = () => {
    const pc = new RTCPeerConnection();
    pc.ontrack = (event) => {
      const remoteStream = new MediaStream();
      remoteStream.addTrack(event.track);
      setRemoteStream(remoteStream);
    };

    // Add local tracks to the peer connection
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    setPeerConnection(pc);
  };

  return (
    <div>
      <h1>WebRTC Video Chat</h1>
      <div>
        <video autoPlay muted ref={(ref) => ref && (ref.srcObject = localStream)} />
        <video autoPlay ref={(ref) => ref && (ref.srcObject = remoteStream)} />
      </div>
      <button onClick={() => setIsReadyForConnection(true)}>Ready</button>
      <button onClick={startPeerConnection}>Start Peer Connection</button>
    </div>
  );
}

export default App;
