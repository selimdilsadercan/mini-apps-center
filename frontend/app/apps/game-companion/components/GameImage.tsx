'use client';

interface GameImageProps {
  game: {
    _id: string;
    name: string;
    emoji?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function GameImage({ game, size = 'md', className = '' }: GameImageProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const emojiSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  // UI-only mode: Fallback to emoji since we don't have Convex storage
  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center ${emojiSizeClasses[size]} ${className}`}>
      {game.emoji || "🎮"}
    </div>
  );
}
