"use client";

import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import AppBar, { ActivePage } from "@/components/AppBar";
import { MINI_APPS, MiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import { Sparkle, Plus } from "@phosphor-icons/react";

export default function Home() {
  const { isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkle size={16} className="text-indigo-400 animate-pulse" />
            </div>
          </div>
        </main>
        <AppBar activePage={ActivePage.HUB} />
      </div>
    );
  }

  const myApps = MINI_APPS.filter((app) => app.isImplemented);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] selection:bg-indigo-100">

      <main className="flex-1 px-6 pb-28 overflow-y-auto max-w-lg mx-auto w-full pt-10">
        {/* Background Decorative Gradient */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
        </div>


        {/* My Apps Icon Grid (OS Style) */}
        <section className="mb-12">
          <div className="grid grid-cols-4 gap-y-8 gap-x-4">
            {myApps.map((app) => (
              <MiniAppIcon key={app.id} app={app} />
            ))}

            {/* "Add More" / Discover Shortcut */}
            <button
              onClick={() => router.push("/discover")}
              className="flex flex-col items-center group gap-2 cursor-pointer active:scale-95 transition-all duration-200"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 relative overflow-hidden group-hover:scale-105 transition-all">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)]"></div>
                <Plus
                  size={28}
                  color="white"
                  weight="bold"
                  className="transition-all"
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 group-hover:text-blue-500">
                Explore
              </span>
            </button>
          </div>
        </section>

        {/* Empty State if no apps implemented yet */}
        {myApps.length === 0 && (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-xl shadow-indigo-100/20 px-8">
            <div className="bg-indigo-600/10 w-16 h-16 rounded-[1rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Sparkle size={32} weight="fill" className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">
              Build your OS
            </h3>
            <p className="text-gray-500 text-[13px] leading-relaxed mb-8">
              Your home screen is empty. Add modules from the discover section
              to customize your experience.
            </p>
            <button
              onClick={() => router.push("/discover")}
              className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
            >
              Start Exploring
            </button>
          </div>
        )}
      </main>

      <AppBar activePage={ActivePage.HUB} />
    </div>
  );
}

/**
 * OS-Style Mini App Icon Component (Internal to Home)
 */
function MiniAppIcon({ app }: { app: MiniApp }) {
  const router = useRouter();
  const Icon = app.icon;

  return (
    <button
      onClick={() => router.push(app.href)}
      className="flex flex-col items-center group gap-2 cursor-pointer active:scale-95 transition-all duration-200"
    >
      {/* OS Icon Container - Squircle */}
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-200/50"
        style={{
          backgroundColor: app.color,
          boxShadow: `0 8px 24px -6px ${app.color}40`,
        }}
      >
        {/* Depth Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent"></div>
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
        {/* Inner Border */}
        <div className="absolute inset-0 border border-white/20 rounded-[1.25rem]"></div>

        <Icon
          size={32}
          weight="fill"
          color="white"
          className="relative z-10 transition-transform duration-300 group-hover:rotate-6"
        />
      </div>

      {/* App Label */}
      <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 text-center line-clamp-2 w-full tracking-tight px-1 group-hover:text-indigo-600 transition-colors leading-[1.2]">
        {app.name}
      </span>
    </button>
  );
}
