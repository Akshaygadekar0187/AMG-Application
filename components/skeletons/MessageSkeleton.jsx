const MessageSkeleton = () => {
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {skeletonMessages.map((_, idx) => {
        const isSender = idx % 2 === 0; // simulate sender/receiver alternation
        return (
          <div
            key={idx}
            className={`chat ${isSender ? "chat-end" : "chat-start"}`}
          >
            {!isSender && (
              <div className="chat-image avatar">
                <div className="size-10 rounded-full">
                  <div className="skeleton w-full h-full rounded-full" />
                </div>
              </div>
            )}

            <div className={`chat-bubble flex flex-col ${isSender ? "items-end" : "items-start"} bg-transparent p-0`}>
              <div className="skeleton h-16 w-[200px] rounded-md" />
              <div className={`skeleton h-4 w-16 mt-1 ${isSender ? "ml-auto" : ""}`} />
            </div>

            {isSender && (
              <div className="chat-image avatar">
                <div className="size-10 rounded-full">
                  <div className="skeleton w-full h-full rounded-full" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageSkeleton;
