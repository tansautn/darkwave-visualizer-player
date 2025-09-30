import React, { useState, useEffect } from 'react';

const TypingIntro = ({ onComplete }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Phần giới thiệu - bạn có thể thay đổi nội dung này
  const introSections = [
    {
      title: "Xin chào, tôi là...",
      content: "Một người đam mê âm nhạc và công nghệ. Nơi mà giai điệu gặp gỡ code, và cảm xúc được visualize thành những patterns tuyệt đẹp."
    },
    {
      title: "Âm nhạc là...",
      content: "Ngôn ngữ không cần lời nói. Mỗi beat, mỗi melody là một câu chuyện, một cảm xúc, một khoảnh khắc được đóng băng trong thời gian."
    },
    {
      title: "Hành trình của tôi",
      content: "Bắt đầu từ những bản nhạc đơn giản, đến việc khám phá âm thanh qua visualizer. Tôi tin rằng âm nhạc có thể được cảm nhận qua cả thị giác lẫn thính giác."
    },
    {
      title: "Cảm ơn bạn",
      content: "Đã dành thời gian khám phá không gian âm nhạc của tôi. Hãy để giai điệu dẫn lối và màu sắc kể câu chuyện..."
    }
  ];

  // Hiệu ứng typing
  useEffect(() => {
    if (currentSection >= introSections.length) {
      // Kết thúc intro, fade out
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1000); // Đợi fade out hoàn thành
      }, 2000);
      return;
    }

    const section = introSections[currentSection];
    const fullText = `${section.title}\n\n${section.content}`;
    let index = 0;

    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setCurrentText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
        // Chuyển sang section tiếp theo sau 2.5 giây
        setTimeout(() => {
          setCurrentSection(currentSection + 1);
          setCurrentText('');
        }, 2500);
      }
    }, 50); // Tốc độ typing

    return () => clearInterval(typingInterval);
  }, [currentSection]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center z-50 bg-black/20 transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ pointerEvents: currentSection >= introSections.length ? 'none' : 'auto' }}
    >
      <div className="max-w-2xl mx-auto px-8">
        <div className="bg-black/70 backdrop-blur-lg border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
          <pre className="text-white text-base md:text-lg lg:text-xl leading-relaxed font-light whitespace-pre-wrap font-sans">
            {currentText}
            <span className="inline-block w-0.5 h-5 md:h-6 bg-white animate-pulse ml-1"></span>
          </pre>
          
          {/* Progress dots */}
          <div className="flex gap-2 mt-6 md:mt-8 justify-center">
            {introSections.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSection 
                    ? 'bg-white w-8' 
                    : idx < currentSection 
                    ? 'bg-white/50 w-2' 
                    : 'bg-white/20 w-2'
                }`}
              />
            ))}
          </div>

          {/* Skip button */}
          <button
            onClick={() => {
              setCurrentSection(introSections.length);
            }}
            className="mt-6 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            Bỏ qua intro →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypingIntro;
