"use client";

/** **kalın** ve eski «kalın» biçimini render eder */
export default function ChatMessageContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const parts = content.split(/(\*\*[^*]+\*\*|«[^»]+»)/g);

  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (!part) return null;
        const boldMatch = part.match(/^\*\*(.+)\*\*$/);
        if (boldMatch) {
          return (
            <strong key={i} className="font-bold">
              {boldMatch[1]}
            </strong>
          );
        }
        const legacyMatch = part.match(/^«(.+)»$/);
        if (legacyMatch) {
          return (
            <strong key={i} className="font-bold">
              {legacyMatch[1]}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
