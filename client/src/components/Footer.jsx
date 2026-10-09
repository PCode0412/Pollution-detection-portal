import React from 'react';
import { Waves, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-400" />
          <span>Chennai Water Bodies Plastic Pollution Detection Portal (2022–2026)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>3rd Year College Full-Stack Academic Project</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5" /> React + Express + MySQL
          </span>
        </div>
      </div>
    </footer>
  );
}
