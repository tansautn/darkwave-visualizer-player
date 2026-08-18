import React, { useState, useEffect } from 'react';
import SlashingTitle from './SlashingTitle';

const WelcomeScreen = () => {
  const [ready, setReady] = useState(false);

  // Sau một khoảng, chuyển tagline sang "click to start".
  // Hiệu ứng slash trên title tự chạy bằng CSS thuần — không cần JS.
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover brightness-[0.45]"
        src="/flower_loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="relative flex h-full items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="text-center">
        <SlashingTitle
          prefix="Zuko the"
          words={['Coder', 'DJ']}
          className="text-white text-6xl md:text-8xl font-black mb-6 tracking-tight font-['Roboto_Mono',monospace] uppercase"
        />

        <p className="text-white/70 text-xl mb-2 animate-pulse">
          {!ready ? '— NHẶT LÁ ĐÁ ỐNG BƠ FULL TIME —' : 'VAR vào màn hình để bắt đầu...'}
        </p>
        {ready && <p className="text-white/50 text-sm">
          Click anywhere to start
        </p>}

        {/* Loading dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '700ms' }}></div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
