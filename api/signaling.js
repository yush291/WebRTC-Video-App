// api/signaling.js
let connections = {};

export default function handler(req, res) {
  if (req.method === 'POST') {
    // Handle signaling data (offer, answer, ice candidates)
    const { type, payload, userId } = req.body;

    if (!connections[userId]) {
      connections[userId] = { peerConnection: null, dataChannel: null };
    }

    const userConnection = connections[userId];

    if (type === 'offer') {
      // Handle offer (create peer connection, set local description, etc.)
      const { offer } = payload;
      userConnection.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
          return userConnection.peerConnection.createAnswer();
        })
        .then((answer) => {
          userConnection.peerConnection.setLocalDescription(answer);
          res.status(200).json({ answer });
        });
    } else if (type === 'answer') {
      // Handle answer (set remote description)
      const { answer } = payload;
      userConnection.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      res.status(200).json({ message: 'Answer set successfully' });
    } else if (type === 'candidate') {
      // Handle ICE candidate
      const { candidate } = payload;
      userConnection.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      res.status(200).json({ message: 'ICE candidate added successfully' });
    } else {
      res.status(400).json({ error: 'Invalid signaling type' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
