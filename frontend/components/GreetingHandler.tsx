"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, UserCircle } from "@phosphor-icons/react";
import { useNotifications } from "@/hooks/use-notifications";
import { createBrowserClient } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserPreferencesAction } from "@/app/home/actions";
import { upsertProfileUserInCache } from "@/lib/cache/profileCache";

import { useRouter, usePathname } from "next/navigation";

const client = createBrowserClient();

export function GreetingHandler() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { permission, handleRequestPermission } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  
  // greetingStep:
  // - 0: None / Hidden
  // - 1: Notification Prompt
  // - 2: Username Form Modal
  const [greetingStep, setGreetingStep] = useState<0 | 1 | 2>(0);
  const [usernameInput, setUsernameInput] = useState("");
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);

  const [hasUsername, setHasUsername] = useState<boolean | null>(null);

  // Use the same query key as HomeContext to leverage caching
  const prefsQuery = useQuery({
    queryKey: ["user", "preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await getUserPreferencesAction(user.id);
      return res.data;
    },
    enabled: isLoaded && !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  useEffect(() => {
    if (isLoaded && user && prefsQuery.data) {
      const pref = prefsQuery.data;
      const ignoredPaths = ["/onboarding", "/login", "/landing", "/"];
      
      // Additional safeguard: Check localStorage if the query still says false
      // Onboarding temporarily disabled, keep infrastructure
      const locallyFinished = localStorage.getItem(`onboarding_completed_${user.id}`) === "true";
      const actuallyFinished = true; // pref.isOnboardingFinished || locallyFinished;

      if (!actuallyFinished && !ignoredPaths.includes(pathname)) {
        console.log("Onboarding not finished, redirecting...", { 
          isOnboardingFinished: pref.isOnboardingFinished, 
          locallyFinished 
        });
        router.replace("/onboarding");
      }
    }
  }, [isLoaded, user, prefsQuery.data, pathname, router]);

  useEffect(() => {
    if (isLoaded && user) {
      // Veritabanı ile senkronize et
      const fullName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || null;
      client.users.getOrCreateUser({ 
        clerkId: user.id,
        username: user.username || undefined,
        fullName: fullName || undefined,
        avatarUrl: user.imageUrl
      }).then(res => {
        const dbUser = res.user;
        const usernameConfigured = !!(dbUser?.username);
        setHasUsername(usernameConfigured);
        
        if (!usernameConfigured) {
          setGreetingStep(2);
        } else {
          setGreetingStep(0);
        }
      }).catch(err => {
        console.error("User sync error:", err);
      });
    }
  }, [isLoaded, user]);

  // Removed getPendingRequests polling to optimize initial load as requested

  const closeGreeting = () => {
    setGreetingStep(0);
    localStorage.setItem("notification_prompt_shown", "true");
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanUsername = usernameInput.trim().toLowerCase();
    if (!cleanUsername) {
      alert("Kullanıcı adı boş olamaz!");
      return;
    }

    if (cleanUsername.length > 26) {
      alert("Kullanıcı adı en fazla 26 karakter olmalıdır!");
      return;
    }

    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      alert("Kullanıcı adı yalnızca küçük harfler, sayılar ve alt çizgi/nokta/tire içerebilir, boşluk içeremez!");
      return;
    }

    try {
      setIsSubmittingUsername(true);

      // Update database users record directly, bypass Clerk's username parameter limits
      const fullName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || null;
      await client.users.getOrCreateUser({
        clerkId: user.id,
        username: cleanUsername,
        fullName: fullName || undefined,
        avatarUrl: user.imageUrl,
      });

      const refreshed = await client.users.getUserByClerkId(user.id);
      if (refreshed.user) {
        upsertProfileUserInCache(queryClient, user.id, refreshed.user);
      }

      // Update local state so modal closes or transitions
      setHasUsername(true);
      setGreetingStep(0);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Kullanıcı adı kaydedilemedi. Bu isim kullanımda olabilir.");
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  if (greetingStep === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-sm bg-[#FAF9F7] rounded-[2.5rem] p-8 shadow-2xl border border-white flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-6 text-indigo-600">
            <UserCircle size={40} weight="fill" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">
            Hoş Geldiniz!
          </h2>
          <p className="text-gray-500 text-xs leading-relaxed mb-6 text-center">
            Devam etmeden önce lütfen kendinize benzersiz bir kullanıcı adı belirleyin.
          </p>
          
          <form onSubmit={handleUsernameSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <input
                required
                type="text"
                maxLength={26}
                placeholder="kullanici_adi"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-gray-300"
              />
              <span className="text-[9px] text-gray-400 block px-1">
                * En fazla 26 karakter (küçük harf, rakam, nokta, tire ve alt çizgi).
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmittingUsername}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center disabled:bg-indigo-400"
            >
              {isSubmittingUsername ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Kaydet ve Devam Et"
              )}
            </button>

            <button
              type="button"
              onClick={() => signOut()}
              className="w-full text-gray-400 text-[10px] font-medium hover:text-red-500 transition-colors pt-2"
            >
              Çıkış Yap
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
