'use client';

import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { useState, useEffect } from 'react';

interface AvatarGeneratorProps {
  name: string;
  size?: number;
  className?: string;
  initialAvatar?: string;
  onAvatarChange?: (avatarUrl: string) => void;
}

export default function AvatarGenerator({ 
  name, 
  size = 80, 
  className = '', 
  initialAvatar,
  onAvatarChange 
}: AvatarGeneratorProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>('');


  const generateAvatarOptions = () => {
    return {
      size: size,
      backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    };
  };

  useEffect(() => {
    // Use initial avatar if provided, otherwise generate new one
    if (initialAvatar) {
      setAvatarUrl(initialAvatar);
      onAvatarChange?.(initialAvatar);
    } else {
      // Generate avatar based on name
      const options = generateAvatarOptions();
      
      const avatar = createAvatar(avataaars, {
        seed: name,
        ...options,
      });

      const svgString = avatar.toString();
      // Use encodeURIComponent instead of btoa to handle Unicode characters
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      
      setAvatarUrl(dataUrl);
      onAvatarChange?.(dataUrl);
    }
  }, [name, size, initialAvatar, onAvatarChange]);

  const generateNewAvatar = () => {
    // Generate a new random avatar
    const options = generateAvatarOptions();
    
    const avatar = createAvatar(avataaars, {
      seed: `${name}-${Date.now()}`, // Add timestamp for randomness
      ...options,
    });

    const svgString = avatar.toString();
    // Use encodeURIComponent instead of btoa to handle Unicode characters
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    
    setAvatarUrl(dataUrl);
    onAvatarChange?.(dataUrl);
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Avatar for ${name}`}
            className="rounded-full border-2 border-gray-200"
            style={{ width: size, height: size }}
          />
        ) : (
          <div 
            className="rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin"></div>
          </div>
        )}
        {avatarUrl && (
          <button
            type="button"
            onClick={generateNewAvatar}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
            title="Generate new avatar"
          >
            ↻
          </button>
        )}
      </div>
    </div>
  );
}
