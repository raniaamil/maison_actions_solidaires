// src/components/ui/Avatar.jsx
'use client';

import { useState } from 'react';

export default function Avatar({ src, alt, size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Si pas d'image ou erreur de chargement, afficher les initiales
  if (!src || imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}
        title={alt}
      >
        {getInitials(alt)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover border-2 border-gray-200 flex-shrink-0`}
      onError={() => setImageError(true)}
    />
  );
}