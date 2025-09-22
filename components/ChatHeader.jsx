import { X, Search } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ searchTerm, setSearchTerm, setProfilePicModal }) => {
  const { selectedUser, setSelectedUser, onlineUsers } = useChatStore();

  if (!selectedUser) return null;

  const userEmail = selectedUser?.email || "";
  const userName = selectedUser?.fullName || userEmail || "Unknown User";
  const userProfilePic = selectedUser?.profilePic || "/avatar.png";

  const isOnline = selectedUser?.id
    ? onlineUsers.some((u) => u.id === selectedUser.id)
    : false;

  return (
    <div className="p-3 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between gap-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div
            className="avatar cursor-pointer"
            onClick={() =>
              setProfilePicModal({
                src: userProfilePic,
                name: userName,
              })
            }
          >
            <div className="size-10 rounded-full overflow-hidden relative border">
              <img
                src={userProfilePic}
                alt={userName}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium leading-none">{userName}</h3>
            <p
              className={`text-sm ${
                isOnline ? "text-green-600" : "text-base-content/70"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Search + Close */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-base-200 rounded-lg px-2">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-1 bg-transparent outline-none text-sm w-32"
            />
          </div>

          <button
            onClick={() => setSelectedUser(null)}
            className="p-1 rounded-full hover:bg-base-200 transition"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
