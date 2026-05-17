// Custom React hook that manages the Socket.IO connection.
// Connects when user logs in, disconnects on logout.

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { addMessage, setTyping, setUserOnline, setUserOffline } from '../features/chat/chatSlice';

const useSocket = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const socketRef = useRef(null); // useRef persists across re-renders without causing them

  useEffect(() => {
    if (!user) return; // Only connect if logged in

    // Connect to the backend Socket.IO server
    socketRef.current = io('http://localhost:5000', {
      withCredentials: true // Send JWT cookie
    });

    const socket = socketRef.current;

    // Listen for new messages
    socket.on('message:new', (data) => {
      dispatch(addMessage(data));
    });

    // Listen for typing events
    socket.on('typing:start', ({ userId, userName, conversationId }) => {
      // Note: conversationId comes from socket.to room, listen on client via conversation:join
    });

    // Listen for online/offline status
    socket.on('user:online', ({ userId }) => {
      dispatch(setUserOnline(userId));
    });

    socket.on('user:offline', ({ userId }) => {
      dispatch(setUserOffline(userId));
    });

    // Cleanup: disconnect when component unmounts or user logs out
    return () => {
      socket.disconnect();
    };
  }, [user, dispatch]);

  return socketRef.current;
};

export default useSocket;