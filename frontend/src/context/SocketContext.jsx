import { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { addMessage, setTyping, setUserOnline, setUserOffline } from '../features/chat/chatSlice';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('message:new', (data) => {
      console.log('📩 message:new:', data);
      dispatch(addMessage(data));
    });

    socket.on('typing:start', ({ userId, userName, conversationId }) => {
      dispatch(setTyping({ conversationId, userId, userName, isTyping: true }));
    });

    socket.on('typing:stop', ({ userId, conversationId }) => {
      dispatch(setTyping({ conversationId, userId, userName: '', isTyping: false }));
    });

    socket.on('user:online', ({ userId }) => dispatch(setUserOnline(userId)));
    socket.on('user:offline', ({ userId }) => dispatch(setUserOffline(userId)));

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, dispatch]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook — any component calls this to get the socket
export const useSocket = () => useContext(SocketContext);