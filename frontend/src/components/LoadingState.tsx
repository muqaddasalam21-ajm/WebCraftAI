import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading WebCraftAI data...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center w-full">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-brand-400 blur-md opacity-25 animate-pulse" />
        <Loader2 className={`${sizeClasses[size]} text-brand-600 animate-spin relative z-10`} />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};
