import { useSelector } from 'react-redux';

export default function TopBar({ conversation }) {
  const { typingUsers } = useSelector(state => state.chat);
  const typingInThis = typingUsers[conversation?.id] || {};
  const typers = Object.values(typingInThis);

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
          {conversation?.other_user_pic
            ? <img src={conversation.other_user_pic} alt="" className="w-full h-full object-cover" />
            : conversation?.other_user_name?.charAt(0).toUpperCase()
          }
        </div>
        {conversation?.is_online ? (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
        ) : null}
      </div>
      <div>
        <h3 className="text-white font-semibold">{conversation?.other_user_name}</h3>
        {typers.length > 0 ? (
          <p className="text-green-400 text-xs">typing...</p>
        ) : (
          <p className="text-gray-400 text-xs">
            {conversation?.is_online ? 'Online' : 'Offline'}
          </p>
        )}
      </div>
    </div>
  );
}