import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markConversationRead } from '../features/chat/chatSlice';
import { useSocket } from '../context/SocketContext';
import MessageBubble from './MessageBubble';
import TopBar from './TopBar';
import api from '../services/api';

export default function ChatWindow() {
  const dispatch = useDispatch();
  const socketRef = useSocket();
  const { user } = useSelector(state => state.auth);
  const { activeConversationId, messages, conversations } = useSelector(state => state.chat);

  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const activeConvIdRef = useRef(activeConversationId);

  useEffect(() => { activeConvIdRef.current = activeConversationId; }, [activeConversationId]);

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
    if (!trimmed || !convId || !socket || !socket.connected) return;
    setText('');
    socket.emit('message:send', { conversationId: convId, messageText: trimmed });
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

  // ✅ Unified file upload handler for both images and documents
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);                          // key is now 'file' not 'image'
    formData.append('conversationId', activeConvIdRef.current);

    try {
      const res = await api.post('/messages/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch({ type: 'chat/addMessage', payload: { message: res.data.message } });
    } catch (err) {
      console.error('File upload failed:', err);
      alert(err.response?.data?.message || 'Upload failed. Max size is 10MB.');
    } finally {
      setUploading(false);
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
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload progress indicator */}
      {uploading && (
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-t border-gray-700">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Uploading file...</span>
        </div>
      )}

      <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-end gap-3">

        {/* ✅ Image upload button */}
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          className="text-gray-400 hover:text-blue-400 transition-colors flex-shrink-0 mb-1 text-xl"
          title="Send image"
        >
          🖼️
        </button>
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleFileUpload}
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
        />

        {/* ✅ Document upload button */}
        <button
          onClick={() => docInputRef.current?.click()}
          disabled={uploading}
          className="text-gray-400 hover:text-green-400 transition-colors flex-shrink-0 mb-1 text-xl"
          title="Send document (PDF, Word, Excel, PPT, TXT) — max 10MB"
        >
          📄
        </button>
        <input
          type="file"
          ref={docInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          className="hidden"
        />

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
          disabled={!text.trim() || uploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex-shrink-0 transition-colors font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}