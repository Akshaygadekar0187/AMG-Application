import { useEffect, useRef, useState, useMemo } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [profilePicModal, setProfilePicModal] = useState(null); // stores clicked profile data

  // fetch messages on selection
  useEffect(() => {
    if (!selectedUser?.id) return;

    getMessages(selectedUser.id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser?.id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  const currentMessages = messages[selectedUser?.id] || [];

  const filteredMessages = useMemo(() => {
    if (!searchTerm) return currentMessages;
    return currentMessages.filter((m) =>
      m.text?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, currentMessages]);

  useEffect(() => {
    if (messageEndRef.current && currentMessages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages]);

  if (!selectedUser)
    return <div className="flex-1 flex items-center justify-center">Select a chat</div>;

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} setProfilePicModal={setProfilePicModal} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  const formatDate = (dateString) => {
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto relative">
      <ChatHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.map((message, index) => {
          const isSender = Number(message.sender?.id) === Number(authUser.id);

          const prevMessage = filteredMessages[index - 1];
          const prevDate = prevMessage ? formatDate(prevMessage.createdAt) : null;
          const currentDate = formatDate(message.createdAt);

          const showDate = prevDate !== currentDate;

          return (
            <div key={message.id || index}>
              {showDate && (
                <div className="flex justify-center my-2">
                  <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full shadow-sm">
                    {currentDate}
                  </span>
                </div>
              )}

              <div
                className={`chat ${isSender ? "chat-end" : "chat-start"}`}
                ref={index === filteredMessages.length - 1 ? messageEndRef : null}
              >
                {!isSender && (
                  <div
                    className="chat-image avatar cursor-pointer"
                    onClick={() =>
                      setProfilePicModal({
                        src: selectedUser.profilePic || "/avatar.png",
                        name: selectedUser.fullName || selectedUser.email,
                      })
                    }
                  >
                    <div className="size-10 rounded-full border">
                      <img
                        src={selectedUser.profilePic || "/avatar.png"}
                        alt="receiver"
                      />
                    </div>
                  </div>
                )}

                <div
                  className={`chat-bubble flex flex-col ${
                    isSender ? "items-end" : "items-start"
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.text && (
                    <p>
                      {searchTerm
                        ? message.text
                            .split(new RegExp(`(${searchTerm})`, "gi"))
                            .map((part, i) =>
                              part.toLowerCase() === searchTerm.toLowerCase() ? (
                                <mark key={i} className="bg-yellow-200">
                                  {part}
                                </mark>
                              ) : (
                                part
                              )
                            )
                        : message.text}
                    </p>
                  )}
                  <time
                    className={`text-xs opacity-50 mt-1 ${
                      isSender ? "text-right" : ""
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>

                {isSender && (
                  <div
                    className="chat-image avatar cursor-pointer"
                    onClick={() =>
                      setProfilePicModal({
                        src: authUser.profilePic || "/avatar.png",
                        name: authUser.fullName || authUser.email,
                      })
                    }
                  >
                    <div className="size-10 rounded-full border">
                      <img
                        src={authUser.profilePic || "/avatar.png"}
                        alt="sender"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />

      {/* 🔑 Modal for Profile Pic */}
      {profilePicModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50"
          onClick={() => setProfilePicModal(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={profilePicModal.src}
              alt="profile enlarged"
              className="max-w-[90vw] max-h-[70vh] rounded-lg shadow-lg"
            />
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 bg-white text-black rounded-full px-2 py-1 shadow hover:bg-gray-200"
              onClick={() => setProfilePicModal(null)}
            >
              ✕
            </button>
          </div>
          {/* Username below image */}
          <p className="text-white text-lg mt-4">{profilePicModal.name}</p>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
