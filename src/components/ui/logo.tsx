
import React from 'react';

export function FlowcodeLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img 
        src="https://neompzltxilcimodyvpd.supabase.co/storage/v1/object/public/flou//LOGO%2002%20(1).svg"
        alt="Flowcode Logo"
        className="h-8 w-auto"
      />
    </div>
  );
}
