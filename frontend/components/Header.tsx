"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { SquaresFour } from "@phosphor-icons/react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-5 py-4 bg-[#FAF9F7]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
          <SquaresFour size={24} weight="fill" color="white" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-gray-900">Everything</span>
      </div>
      <div>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-full bg-indigo-600 px-5 py-2 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95">
              Get Started
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" appearance={{
              elements: {
                userButtonAvatarBox: "w-9 h-9 border-2 border-indigo-100 shadow-sm"
              }
            }} />
          </div>
        </SignedIn>
      </div>
    </header>
  );
}
