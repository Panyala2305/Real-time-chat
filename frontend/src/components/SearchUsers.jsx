import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createConversation, fetchConversations, setActiveConversation, fetchMessages } from '../features/chat/chatSlice';
import api from '../services/api';

export default function SearchUsers({ onClose }) {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setResults([]); return; }

    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${val}`);
      setResults(res.data.users);
    } catch {}
    setLoading(false);
  };

  const handleStartChat = async (userId) => {
    const result = await dispatch(createConversation(userId));
    if (createConversation.fulfilled.match(result)) {
      const convId = result.payload.id;
      await dispatch(fetchConversations());
      dispatch(setActiveConversation(convId));
      dispatch(fetchMessages(convId));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex items-center gap-3">
          <input
            autoFocus
            type="text" value={query} onChange={handleSearch}
            placeholder="Search by name or email..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && <p className="text-gray-400 text-center p-4">Searching...</p>}
          {!loading && results.length === 0 && query && (
            <p className="text-gray-500 text-center p-4">No users found</p>
          )}
          {results.map(user => (
            <div
              key={user.id}
              onClick={() => handleStartChat(user.id)}
              className="flex items-center gap-3 p-4 hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
              {user.is_online ? (
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}