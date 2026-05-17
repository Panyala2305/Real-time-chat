import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markConversationRead } from '../features/chat/chatSlice';
import MessageBubble from './MessageBubble';
import TopBar from './TopBar';
import api from '../services/api';

export default function ChatWindow({ socket }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { activeConversationId, messages, conversations } = useSelector(state => state.chat);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentMessages = messages[activeConversationId] || [];
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Join/leave socket room when conversation changes
  useEffect(() => {
    if (!socket || !activeConversationId) return;
    socket.emit('conversation:join', activeConversationId);
    dispatch(markConversationRead(activeConversationId));
    return () => socket.emit('conversation:leave', activeConversationId);
  }, [socket, activeConversationId]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit('typing:start', { conversationId: activeConversationId });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: activeConversationId });
    }, 1500);
  };

  const handleSend = async () => {
    if (!text.trim() || !activeConversationId) return;
    setSending(true);
    try {
      socket?.emit('message:send', {
        conversationId: activeConversationId,
        messageText: text
      });
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('conversationId', activeConversationId);
    try {
      await api.post('/messages/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
          <p className="text-gray-400">Select a conversation or search for someone to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <TopBar conversation={activeConversation} />

      {/* Messages area */}
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

      {/* Input area */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-end gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0 mb-1"
          title="Send image"
        >
          📎
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        <textarea
          value={text} onChange={handleTyping} onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        <button
          onClick={handleSend} disabled={!text.trim() || sending}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex-shrink-0 transition-colors font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}