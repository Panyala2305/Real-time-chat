import { useDispatch, useSelector } from 'react-redux';
import { setActiveConversation, fetchMessages } from '../features/chat/chatSlice';

export default function Sidebar({ onSearch }) {
  const dispatch = useDispatch();
  const { conversations, activeConversationId } = useSelector(state => state.chat);

  const handleSelect = (conv) => {
    dispatch(setActiveConversation(conv.id));
    dispatch(fetchMessages(conv.id));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white text-xl font-bold mb-3">Messages</h2>
        <button
          onClick={onSearch}
          className="w-full bg-gray-700 text-gray-400 rounded-lg px-4 py-2 text-left hover:bg-gray-600 transition-colors"
        >
          🔍 Search users...
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-gray-500 text-center p-8">No conversations yet.<br/>Search for users to start chatting!</p>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => handleSelect(conv)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700/50
                ${activeConversationId === conv.id ? 'bg-gray-700' : ''}`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {conv.other_user_pic
                    ? <img src={conv.other_user_pic} alt="" className="w-full h-full object-cover" />
                    : conv.other_user_name?.charAt(0).toUpperCase()
                  }
                </div>
                {/* Online dot */}
                {conv.is_online ? (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                ) : null}
              </div>

              {/* Name + last message */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium truncate">{conv.other_user_name}</span>
                  <span className="text-gray-500 text-xs">{formatTime(conv.last_message_time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm truncate">
                    {conv.last_message_type === 'image' ? '📷 Image' : (conv.last_message || 'No messages yet')}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}