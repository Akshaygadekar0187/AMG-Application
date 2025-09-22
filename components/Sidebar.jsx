import { useEffect, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    onlineUsers,
  } = useChatStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getUsers();
  }, []);

  // Filter users
  const visibleEntries = useMemo(() => {
    const filtered = (showOnlineOnly ? onlineUsers : users).filter((u) => {
      const name = u.fullName || u.email || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    return filtered;
  }, [showOnlineOnly, users, onlineUsers, searchTerm]);

  if (isUsersLoading && users.length === 0) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        {/* Search bar */}
        <div className="mt-3 hidden lg:flex items-center bg-base-200 rounded-lg px-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search contacts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 bg-transparent outline-none text-sm"
          />
        </div>

        {/* Online toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto w-full py-3">
        {visibleEntries.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No users found</div>
        )}

        {visibleEntries.map((profile) => {
          const isSelected = selectedUser?.id === profile.id;
          const name = profile.fullName || profile.email;
          const avatar = profile.profilePic || "/avatar.png";
          const isOnline = onlineUsers.some((u) => u.id === profile.id);

          return (
            <button
              key={profile.id}
              onClick={() => setSelectedUser(profile)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                isSelected ? "bg-base-300 ring-1 ring-base-300" : ""
              }`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={avatar}
                  alt={name}
                  className="w-12 h-12 object-cover rounded-full"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{name}</div>
                <div className="text-sm text-zinc-400">
                  {isOnline ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
