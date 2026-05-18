const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileIcon = (fileName) => {
  if (!fileName) return "📄";
  const ext = fileName.split(".").pop().toLowerCase();
  if (ext === "pdf") return "📕";
  if (ext === "doc" || ext === "docx") return "📘";
  if (ext === "xls" || ext === "xlsx") return "📗";
  if (ext === "ppt" || ext === "pptx") return "📙";
  if (ext === "txt") return "📃";
  return "📄";
};

function TextMessage({ text }) {
  return (
    <p className="text-sm leading-relaxed break-words">{text}</p>
  );
}

function ImageMessage({ url }) {
  return (
    <img
      src={url}
      alt="shared"
      className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => window.open(url, "_blank")}
    />
  );
}

function DocumentMessage({ url, fileName, fileSize, isOwn }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 no-underline"
    >
      <span className="text-4xl leading-none flex-shrink-0">
        {getFileIcon(fileName)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {fileName || "Document"}
        </p>
        <p className={isOwn ? "text-xs text-blue-200" : "text-xs text-gray-400"}>
          {formatSize(fileSize)}
        </p>
      </div>
      <span className="text-sm flex-shrink-0">⬇️</span>
    </a>
  );
}

function Timestamp({ dateStr, isOwn, isRead }) {
  const time = new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className={isOwn ? "flex items-center gap-1 mt-1 justify-end" : "flex items-center gap-1 mt-1 justify-start"}>
      <span className="text-xs opacity-60">{time}</span>
      {isOwn && (
        <span className="text-xs opacity-60">{isRead ? "✓✓" : "✓"}</span>
      )}
    </div>
  );
}

export default function MessageBubble({ message, isOwn }) {
  const bubbleClass = isOwn
    ? "max-w-xs lg:max-w-md rounded-2xl rounded-br-sm px-4 py-2 bg-blue-600 text-white"
    : "max-w-xs lg:max-w-md rounded-2xl rounded-bl-sm px-4 py-2 bg-gray-700 text-white";

  return (
    <div className={isOwn ? "flex justify-end mb-2" : "flex justify-start mb-2"}>
      <div className={bubbleClass}>
        {message.message_type === "text" && (
          <TextMessage text={message.message_text} />
        )}
        {message.message_type === "image" && (
          <ImageMessage url={message.image_url} />
        )}
        {message.message_type === "document" && (
          <DocumentMessage
            url={message.image_url}
            fileName={message.file_name}
            fileSize={message.file_size}
            isOwn={isOwn}
          />
        )}
        <Timestamp
          dateStr={message.created_at}
          isOwn={isOwn}
          isRead={message.is_read}
        />
      </div>
    </div>
  );
}
