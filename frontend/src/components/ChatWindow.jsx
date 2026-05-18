import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markConversationRead } from '../features/chat/chatSlice';
import { useSocket } from '../context/SocketContext';
import MessageBubble from './MessageBubble';
import TopBar from './TopBar';
import api from '../services/api';

export default function ChatWindow() {
  const dispatch = useDispatch();
  const socketRef = useSocket(); // ✅ direct from context
  const { user } = useSelector(state => state.auth);
  const { activeConversationId, messages, conversations } = useSelector(state => state.chat);

  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeConvIdRef = useRef(activeConversationId);

  useEffect(() => {
    activeConvIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const currentMessages = messages[activeConversationId] || [];
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !activeConversationId) return;
    socket.emit('conversation:join', activeConversationId);
    dispatch(markConversationRead(activeConversationId));
    return () => socket.emit('conversation:leave', activeConversationId);
  }, [socketRef, activeConversationId, dispatch]);

  const handleSend = () => {
    const socket = socketRef?.current;
    const convId = activeConvIdRef.current;
    const trimmed = text.trim();

    // ✅ This is the definitive debug log
    console.log('🚀 handleSend:', {
      hasSocket: !!socket,
      connected: socket?.connected,
      convId,
      trimmed
    });

    if (!trimmed || !convId || !socket || !socket.connected) return;

    setText('');
    socket.emit('message:send', { conversationId: convId, messageText: trimmed });
    console.log('✅ emitted');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    const socket = socketRef?.current;
    if (!socket?.connected) return;
    socket.emit('typing:start', { conversationId: activeConvIdRef.current });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef?.current?.emit('typing:stop', { conversationId: activeConvIdRef.current });
    }, 1500);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('conversationId', activeConvIdRef.current);
    try {
      const res = await api.post('/messages/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch({ type: 'chat/addMessage', payload: { message: res.data.message } });
    } catch (err) {
      console.error('Image upload failed', err);
    }
    e.target.value = '';
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-white text-2xl font-semibold mb-2">Real-Chat</h2>
          <p className="text-gray-400">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <TopBar conversation={activeConversation} />

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {currentMessages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-end gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0 mb-1"
        >
          📎
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        <textarea
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex-shrink-0 transition-colors font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}