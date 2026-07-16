"use client";

export default function YouTubeDiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans">
      {children}
    </div>
  );
}
