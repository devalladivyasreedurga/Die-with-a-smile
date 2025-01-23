import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { v4 as uuidV4 } from "uuid";

const socket = io("https://die-with-a-smile-production.up.railway.app");

const VideoChat = () => {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    if (joined) {
      socket.emit("join-room", roomId, socket.id);

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          myVideo.current.srcObject = stream;

          socket.on("user-connected", (userId) => {
            const peer = new Peer({
              initiator: true,
              trickle: false,
              stream: stream,
            });

            peer.on("signal", (data) => {
              socket.emit("offer", data, roomId);  // Send offer to the other user
            });

            peer.on("stream", (userStream) => {
              userVideo.current.srcObject = userStream;
            });

            socket.on("answer", (answer) => {
              peer.signal(answer);  // Receive answer from the other user
            });

            socket.on("ice-candidate", (candidate) => {
              peer.addIceCandidate(candidate);  // Add ICE candidate
            });

            peerRef.current = peer;
          });

          socket.on("user-disconnected", () => {
            if (peerRef.current) {
              peerRef.current.destroy();
            }
          });
        });
    }
  }, [joined, roomId]);

  const createRoom = () => {
    const newRoomId = uuidV4();
    setRoomId(newRoomId);
    setJoined(true);
  };

  const joinRoom = () => {
    setJoined(true);
    socket.emit("join-room", roomId, socket.id);
  };

  return (
    <div>
      {!joined ? (
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
          <button onClick={createRoom}>Create Room</button>
        </div>
      ) : (
        <div>
          <h2>Room ID: {roomId}</h2>
          <video ref={myVideo} autoPlay muted />
          <video ref={userVideo} autoPlay />
        </div>
      )}
    </div>
  );
};

export default VideoChat;
