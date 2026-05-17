export default function MessageBubble({ message, isOwn }) {
  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2 ${
        isOwn
          ? 'bg-blue-600 text-white rounded-br-sm'
          : 'bg-gray-700 text-white rounded-bl-sm'
      }`}>
        {message.message_type === 'image' ? (
          <img
            src={message.image_url}
            alt="shared"
            className="rounded-lg max-w-full cursor-pointer"
            onClick={() => window.open(message.image_url, '_blank')}
          />
        ) : (
          <p className="text-sm leading-relaxed break-words">{message.message_text}</p>
        )}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs opacity-60">{formatTime(message.created_at)}</span>
          {isOwn && (
            <span className="text-xs opacity-60">
              {message.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}