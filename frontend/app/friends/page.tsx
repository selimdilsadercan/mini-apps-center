"use client";

import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Users, 
  UserPlus, 
  Bell, 
  Check, 
  X, 
  Trash, 
  Spinner,
  ArrowLeft,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { useTranslations, useLanguage } from "@/contexts/LanguageContext";
import AppBar, { ActivePage } from "@/components/AppBar";
import { createBrowserClient } from "@/lib/api";
import { friendship } from "@/lib/client";

const client = createBrowserClient();

function FriendsContent() {
  const { user, isLoaded } = useUser();
  const t = useTranslations("friends");
  const { locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("add"); // support /friends?add=clerk_id

  // State
  const [friends, setFriends] = useState<friendship.FriendUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<friendship.PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<friendship.PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<friendship.FriendUser | null>(null);

  // Search State
  const [showSearchPage, setShowSearchPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    if (!user) return;
    try {
      const friendsRes = await client.friendship.getFriends(user.id);
      const requestsRes = await client.friendship.getPendingRequests(user.id);
      const sentRes = await client.friendship.getSentRequests(user.id);
      setFriends(friendsRes.friends);
      setPendingRequests(requestsRes.requests);
      setSentRequests(sentRes.requests);
      
      // Update global badge
      const hasPending = requestsRes.requests.length > 0;
      localStorage.setItem("has_pending_requests", hasPending ? "true" : "false");
      window.dispatchEvent(new CustomEvent("incoming-requests-badge", { detail: { hasPending } }));
    } catch (e) {
      console.error("Error fetching friendship data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (targetId: string) => {
    if (!user) return;
    try {
      const res = await client.friendship.removeFriend({
        userId: user.id,
        friendId: targetId
      });
      if (res.success) {
        showToastMsg(locale === "tr" ? "İstek iptal edildi" : "Request cancelled", "success");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  // Handle invite link from query param
  useEffect(() => {
    if (isLoaded && user && inviteId && inviteId !== user.id) {
      handleSendRequest(inviteId);
      // Clean url
      router.replace("/friends");
    }
  }, [isLoaded, user, inviteId]);

  const showToastMsg = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchedUser(null);
    try {
      const res = await client.users.getUserByUsername(query);
      if (res.user) {
        setSearchedUser(res.user);
      } else {
        setSearchError(t("userNotFound"));
      }
    } catch (err) {
      console.error(err);
      setSearchError(t("inviteError"));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    if (!user || !targetId.trim()) return;
    setActionLoading(true);
    try {
      const res = await client.friendship.sendRequest({
        senderId: user.id,
        receiverId: targetId.trim()
      });

      if (res.success) {
        if (res.message === "accepted") {
          showToastMsg(locale === "tr" ? "İstek otomatik kabul edildi ve arkadaş oldunuz!" : "Request accepted and you are now friends!", "success");
          fetchData();
        } else {
          showToastMsg(t("inviteSent"), "success");
          fetchData();
        }
      } else {
        const msgKey = res.message;
        let finalMsg = t("inviteError");
        if (msgKey === "cannot_add_self") finalMsg = t("cannotAddSelf");
        else if (msgKey === "user_not_found") finalMsg = t("userNotFound");
        else if (msgKey === "already_friends") finalMsg = t("alreadyFriends");
        else if (msgKey === "request_already_sent") finalMsg = t("requestAlreadySent");
        
        showToastMsg(finalMsg, "error");
      }
    } catch (e) {
      console.error(e);
      showToastMsg(t("inviteError"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async (senderFriendId: string) => {
    if (!user) return;
    try {
      const res = await client.friendship.acceptRequest({
        userId: user.id,
        friendId: senderFriendId
      });
      if (res.success) {
        showToastMsg(locale === "tr" ? "Arkadaşlık isteği kabul edildi" : "Friend request accepted", "success");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectRequest = async (senderFriendId: string) => {
    if (!user) return;
    try {
      const res = await client.friendship.rejectRequest({
        userId: user.id,
        friendId: senderFriendId
      });
      if (res.success) {
        showToastMsg(locale === "tr" ? "İstek reddedildi" : "Request rejected", "success");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmRemoveFriend = (friend: friendship.FriendUser) => {
    setFriendToRemove(friend);
    setShowRemoveConfirm(true);
  };

  const handleRemoveFriend = async () => {
    if (!user || !friendToRemove) return;
    try {
      const res = await client.friendship.removeFriend({
        userId: user.id,
        friendId: friendToRemove.id
      });
      if (res.success) {
        showToastMsg(locale === "tr" ? "Arkadaş çıkarıldı" : "Friend removed", "success");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShowRemoveConfirm(false);
      setFriendToRemove(null);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="text-indigo-600 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 pb-32">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 px-6 max-w-md mx-auto w-full pt-10">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/profile")} 
              className="p-2 -ml-2 hover:bg-gray-150 rounded-full transition-colors active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={24} color="#374151" />
            </button>
            <div>
              <h1 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-none mb-1">
                {t("title")}
              </h1>
              <p className="text-xs text-gray-400 font-medium pl-1">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowSearchPage(true);
              setSearchQuery("");
              setSearchedUser(null);
              setSearchError(null);
            }}
            className="p-3 bg-white border border-gray-150 rounded-2xl shadow-sm text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            title={t("searchTitle")}
          >
            <MagnifyingGlass size={20} weight="bold" />
          </button>
        </header>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-orange-200/50 p-6 shadow-xl shadow-orange-100/5 mb-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={20} className="text-orange-500" weight="fill" />
              <h2 className="font-extrabold text-orange-700 text-base">{t("pendingRequests")}</h2>
              <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3.5 bg-orange-50/50 border border-orange-100 rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-100/50 border border-orange-200/30 flex items-center justify-center text-lg overflow-hidden shrink-0">
                      {req.avatar ? <img src={req.avatar} alt="Avatar" className="w-full h-full object-cover" /> : "👤"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 font-extrabold text-sm truncate">{req.username || t("anonymous")}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{t("sentFriendRequest")}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-100"
                    >
                      <Check size={16} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all active:scale-95 cursor-pointer border border-red-100"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <section className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-150 p-6 shadow-xl shadow-indigo-100/5 mb-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={20} className="text-indigo-500" weight="fill" />
              <h2 className="font-extrabold text-gray-800 text-base">{t("sentRequests")}</h2>
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {sentRequests.length}
              </span>
            </div>
            <div className="space-y-3">
              {sentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-150 flex items-center justify-center text-lg overflow-hidden shrink-0">
                      {req.avatar ? <img src={req.avatar} alt="Avatar" className="w-full h-full object-cover" /> : "👤"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 font-extrabold text-sm truncate">{req.username || t("anonymous")}</p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {locale === "tr" ? "Cevap bekleniyor..." : "Waiting for response..."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-all active:scale-95 cursor-pointer border border-red-100 shrink-0"
                  >
                    {locale === "tr" ? "İptal Et" : "Cancel"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Friends List */}
        <section className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-150 p-6 shadow-xl shadow-indigo-100/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-indigo-600" weight="fill" />
              <h2 className="font-extrabold text-gray-900 text-base">{t("myFriends")}</h2>
            </div>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-black px-2.5 py-1 rounded-xl">
              {friends.length}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={24} className="text-indigo-600 animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-xs font-medium px-4 leading-relaxed">
              {t("noFriends")}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-150 flex items-center justify-center text-lg overflow-hidden shrink-0">
                      {friend.avatar ? <img src={friend.avatar} alt="Avatar" className="w-full h-full object-cover" /> : "👤"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 font-extrabold text-sm truncate">{friend.username || t("anonymous")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfirmRemoveFriend(friend)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Search Overlay/Page */}
      {showSearchPage && (
        <div className="fixed inset-0 bg-[#FAF9F7] z-40 overflow-y-auto pb-32">
          {/* Decorative Background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
          </div>

          <main className="px-6 max-w-md mx-auto w-full pt-10">
            {/* Header */}
            <header className="mb-8 flex items-center gap-3">
              <button 
                onClick={() => {
                  setShowSearchPage(false);
                  setSearchQuery("");
                  setSearchedUser(null);
                  setSearchError(null);
                }} 
                className="p-2 -ml-2 hover:bg-gray-150 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={24} color="#374151" />
              </button>
              <div>
                <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-none mb-1">
                  {t("searchTitle")}
                </h1>
                <p className="text-xs text-gray-400 font-medium pl-1">{t("searchDescription")}</p>
              </div>
            </header>

            {/* Search Input Box */}
            <section className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-150 p-6 shadow-xl shadow-indigo-100/10 mb-6">
              <form onSubmit={handleSearch} className="flex flex-col gap-3">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (searchedUser) setSearchedUser(null);
                      if (searchError) setSearchError(null);
                    }}
                    placeholder={t("searchExactPlaceholder")}
                    className="w-full bg-gray-50 border border-gray-150 rounded-2xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-gray-900 placeholder:text-gray-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-3 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <MagnifyingGlass size={20} weight="bold" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={searchLoading || !searchQuery.trim()}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  {searchLoading ? <Spinner size={16} className="animate-spin" /> : <MagnifyingGlass size={18} weight="bold" />}
                  {t("searchButtonText")}
                </button>
              </form>
            </section>

            {/* Search Results */}
            {searchLoading && (
              <div className="flex justify-center py-12">
                <Spinner size={32} className="text-indigo-600 animate-spin" />
              </div>
            )}

            {searchError && !searchLoading && (
              <div className="bg-white/85 backdrop-blur-md rounded-[2rem] border border-red-200/50 p-8 shadow-xl text-center">
                <p className="text-red-600 font-extrabold text-sm mb-1">{searchError}</p>
                <p className="text-gray-400 text-xs">
                  {locale === "tr" 
                    ? "Kullanıcı adını tam ve doğru yazdığınızdan emin olun." 
                    : "Make sure you wrote the exact username correctly."}
                </p>
              </div>
            )}

            {searchedUser && !searchLoading && (
              <section className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-150 p-6 shadow-xl shadow-indigo-100/10 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-[2rem] bg-gray-100 border border-gray-150 flex items-center justify-center text-3xl overflow-hidden shrink-0 mb-4 shadow-inner">
                  {searchedUser.avatar_url ? (
                    <img src={searchedUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    "👤"
                  )}
                </div>

                <h3 className="font-[1000] text-gray-900 text-xl tracking-tight leading-none mb-1">
                  {searchedUser.full_name || searchedUser.username || t("anonymous")}
                </h3>
                {searchedUser.username && (
                  <p className="text-xs text-indigo-600 font-bold mb-6">@{searchedUser.username}</p>
                )}

                {/* Action button in search result */}
                {user.id === searchedUser.clerk_id ? (
                  <div className="w-full py-3.5 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm">
                    {locale === "tr" ? "Bu sizin profiliniz" : "This is your profile"}
                  </div>
                ) : friends.some(f => f.id === searchedUser.clerk_id) ? (
                  <div className="w-full py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm border border-indigo-100">
                    {t("alreadyFriends")}
                  </div>
                ) : pendingRequests.some(r => r.id === searchedUser.clerk_id) ? (
                  <button
                    onClick={async () => {
                      await handleAcceptRequest(searchedUser.clerk_id);
                    }}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-100"
                  >
                    <Check size={18} weight="bold" />
                    {locale === "tr" ? "İsteği Kabul Et" : "Accept Request"}
                  </button>
                ) : sentRequests.some(r => r.id === searchedUser.clerk_id) ? (
                  <div className="w-full flex flex-col gap-2">
                    <div className="w-full py-3 bg-gray-50 text-gray-500 rounded-2xl font-bold text-xs border border-gray-150">
                      {locale === "tr" ? "Arkadaşlık İsteği Gönderildi" : "Friend Request Sent"}
                    </div>
                    <button
                      onClick={async () => {
                        await handleCancelRequest(searchedUser.clerk_id);
                      }}
                      className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl font-bold text-xs transition-all cursor-pointer active:scale-95 border border-red-100"
                    >
                      {locale === "tr" ? "İsteği İptal Et" : "Cancel Request"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      await handleSendRequest(searchedUser.clerk_id);
                    }}
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    {actionLoading ? (
                      <Spinner size={16} className="animate-spin" />
                    ) : (
                      <UserPlus size={18} weight="bold" />
                    )}
                    {t("sendFriendRequest")}
                  </button>
                )}
              </section>
            )}
          </main>
        </div>
      )}

      {/* Confirm Remove Modal */}
      {showRemoveConfirm && friendToRemove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm border border-gray-100 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-5 border border-red-100">
              <Trash size={28} weight="bold" />
            </div>
            <h3 className="font-black text-xl text-gray-900 mb-2">{t("removeFriendTitle")}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">
              {t("removeFriendConfirm", { username: friendToRemove.username || t("anonymous") })}
            </p>
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={handleRemoveFriend}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all active:scale-98 cursor-pointer"
              >
                {t("removeFriend")}
              </button>
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setFriendToRemove(null);
                }}
                className="w-full py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-98 cursor-pointer"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none">
          <div className={`p-4 rounded-2xl border text-sm font-bold shadow-lg flex items-center justify-center text-center ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Bottom App Navigation */}
      <AppBar activePage={ActivePage.PROFILE} />
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
      </div>
    }>
      <FriendsContent />
    </Suspense>
  );
}
