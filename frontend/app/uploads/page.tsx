'use client';

import { useState } from 'react';
import { Upload, X, Inbox } from 'lucide-react';

export default function UploadsPage() {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 select-none">
      {/* Alert banner */}
      {showAlert && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#fdfaf2] border border-[#faebcc] text-[#8a6d3b] rounded-xl text-xs sm:text-sm font-medium animate-fadeIn">
          <span>Uploads are moving — you&apos;ll find them on the Meetings page soon.</span>
          <button onClick={() => setShowAlert(false)} className="text-[#8a6d3b]/70 hover:text-[#8a6d3b] ml-4 transition-colors">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Upload Box (Static Mockup) */}
      <div className="border-2 border-dashed border-violet-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white min-h-[320px] cursor-default">
        {/* Upload Icon */}
        <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
          <Upload size={24} className="text-violet-600" />
        </div>
        
        <h3 className="text-base font-bold text-gray-800 mb-2">Upload a file to generate a transcript</h3>
        <p className="text-xs text-gray-400 max-w-md leading-relaxed mb-6">
          Browse or drag and drop <strong className="text-gray-500 font-medium">MP3, M4A, WAV, MP4</strong> or <strong className="text-gray-500 font-medium">WEBM</strong> files. (Max video size: 100 MB, Max audio size: 500 MB)
        </p>
        
        <button className="btn-primary py-2.5 px-6 font-medium shadow-md shadow-violet-500/20 text-sm hover:scale-100 cursor-default">
          Browse Files
        </button>
      </div>

      {/* Recent Uploads Section (Static Mockup) */}
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
          <Inbox size={20} className="text-gray-400" />
        </div>
        <h4 className="text-sm font-semibold text-gray-700">You have no recent uploads!</h4>
      </div>
    </div>
  );
}
