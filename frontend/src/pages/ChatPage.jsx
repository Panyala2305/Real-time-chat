import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { fetchConversations } from '../features/chat/chatSlice';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import SearchUsers from '../components/SearchUsers';
import useSocket from '../hooks/useSocket';

export default function ChatPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [showSearch, setShowSearch] = useState(false);
  const socket = useSocket(); // Connect to Socket.IO

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">💬 Real-Chat</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: 320px wide on desktop */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-hidden">
          <Sidebar onSearch={() => setShowSearch(true)} />
        </div>

        {/* Chat area */}
        <ChatWindow socket={socket} />
      </div>

      {/* Search modal */}
      {showSearch && <SearchUsers onClose={() => setShowSearch(false)} />}
    </div>
  );
}