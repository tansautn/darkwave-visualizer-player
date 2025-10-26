import React, { useState, useEffect } from 'react';

const WelcomeScreen = () => {
  const [cycleCount, setCycleCount] = useState(0);
  const [showStrikethrough, setShowStrikethrough] = useState(false);
  const [currentRole, setCurrentRole] = useState('Coder');
  const maxCycleCount = 5;
  const strikeTimeout = 700; // mil-secs
  const firstStrike = 2500; // mil-secs
  useEffect(() => {
    if (cycleCount >= maxCycleCount) {
      // Sau 3 lần lặp, giữ ở "DJ"
      return;
    }

    // Sau 1.5 giây, hiển thị strikethrough
    const strikethroughTimer = setTimeout(() => {
      setShowStrikethrough(true);
      
      // Sau 0.5 giây nữa, thay đổi từ Coder -> DJ hoặc ngược lại
      setTimeout(() => {
        setCurrentRole(currentRole === 'Coder' ? 'DJ' : 'Coder');
        setShowStrikethrough(false);
        setCycleCount(cycleCount + 1);
      }, strikeTimeout);
    }, firstStrike);

    return () => clearTimeout(strikethroughTimer);
  }, [cycleCount, currentRole]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
      <div className="text-center">
        <h1 className="text-white text-6xl md:text-8xl font-black mb-6 tracking-tight font-['Roboto_Mono',monospace] uppercase">
          Zuko the{' '}
          <span className="inline-block relative">
            <span 
              className={`transition-opacity duration-${strikeTimeout} animate-in spin-in animate-out zoom-out ${
                showStrikethrough 
                  ? 'opacity-15' 
                  : 'opacity-100'
              }`}
              style={{
                textDecorationLine: showStrikethrough ? 'line-through' : 'none',
                textDecorationThickness: '4px',
                textDecorationColor: '#ef4444'
              }}
            >
              {currentRole}
            </span>
            {showStrikethrough && (
              <span className={`absolute left-0 top-0 w-full text-center animate-out spin-out duration-${strikeTimeout}`}>
                {currentRole === 'Coder' ? 'DJ' : 'Coder'}
              </span>
            )}
          </span>
        </h1>
        
        <p className="text-white/70 text-xl mb-2 animate-pulse">
          {cycleCount < maxCycleCount ? '— NHẶT LÁ ĐÁ ỐNG BƠ FULL TIME —' : 'VAR vào màn hình để bắt đầu...'}
        </p>
        {cycleCount >= maxCycleCount && <p className="text-white/50 text-sm">
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
  );
};

export default WelcomeScreen;
