
import React from 'react';

export function FlowcodeLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="bg-primary rounded-md p-1.5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-primary-foreground"
        >
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9l.707-.293A.997.997 0 0 0 13 12z" />
          <path d="M3 12v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6" />
        </svg>
      </div>
      <span className="text-xl font-bold text-foreground">Flowcode</span>
    </div>
  );
}
