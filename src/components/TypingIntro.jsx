import React, {useEffect, useState} from 'react';

const TypingIntro = ({onComplete}) => {
  const [currentText, setCurrentText] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const introSections = [
    {

      title   : "HỀ LỐ !",
      content : "- Nơi đây có thể có tất cả mọi \"bad things\": dở hơi, hỗn loạn, nhiễu tạp, rối rắm, khó hiểu, chói tai...... \nNhưng tuyệt nhiên chắc chắn sẽ không có > 'C h i P u'. \nCàng hiển nhiên không có >> 'N g â n 9 8'. . . .... "    },
    {
      title   : "Tôi là 01 \"kẻ\" ...",
      content : "Đam mê âm nhạc và công nghệ. Nơi mà giai điệu gặp gỡ code, và cảm xúc được visualize thành những patterns tuyệt đẹp."
    },
  //HỮU DUYÊN, Bạn có thể sẽ thấy tôi đang làm việc. Với màn hình toàn những ngôn ngữ lập trình khó hiểu, nhưng kẻ trước màn hình thì vẫn "quẩy". Đừng ngạc nhiên, đó là việc ngày nào cũng diễn ra !
    {
      title   : "Âm nhạc là...",
      content : "Ngôn ngữ không cần lời nói. Mỗi beat, mỗi melody là một câu chuyện, một cảm xúc, một khoảnh khắc được đóng băng trong thời gian."
    },
    {
      title   : "Hành trình của tôi",
      content : "Bắt đầu từ những bản nhạc đơn giản song hành với những dòng code, đến việc khám phá âm thanh qua visualizer. \nNếu như \"lập trình\" có nhiều ngôn ngữ, thì âm nhạc có nhiều cách để cảm thụ..."
    },
    {
      title   : "Tôi tin rằng",
      content : "Âm nhạc có thể được cảm nhận qua cả thị giác lẫn thính giác. Hay là theo một nghĩa nào đó. \nÂM NHẠC CŨNG CÓ THỂ CÓ \"MÀU SẮC\"..."
    },
    {
      title   : "Cảm ơn bạn",
      content : "Đã dành thời gian đồng hành và khám phá không gian âm nhạc của tôi. \n\nGiờ, hãy để GIAI ĐIỆU DẪN LỐI và MÀU SẮC KỂ CÂU CHUYỆN..."
    }
  ];

  // Hiệu ứng typing
  useEffect(() => {
    if(currentSection >= introSections.length) {
      // Kết thúc intro, fade out
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if(onComplete) {
            onComplete();
          }
        }, 1000); // Đợi fade out hoàn thành
      }, 2000);
      return;
    }

    const section = introSections[currentSection];
    const fullText = `${section.title}\n\n${section.content}`;
    let index = 0;

    const typingInterval = setInterval(() => {
      if(index <= fullText.length) {
        setCurrentText(fullText.slice(0, index));
        index++;
      }
      else {
        clearInterval(typingInterval);
        // Chuyển sang section tiếp theo sau 2.5 giây
        setTimeout(() => {
          setCurrentSection(currentSection + 1);
          setCurrentText('');
        }, 2800);
      }
    }, 50); // Tốc độ typing

    return () => clearInterval(typingInterval);
  }, [currentSection]);

  if(!isVisible) {
    return null;
  }

  return (
  <div
  className={`pointer-events-none absolute inset-0 flex items-center justify-center z-50 bg-black/20 transition-opacity duration-1000 ${
  isVisible ? 'opacity-100' : 'opacity-0'
  }`}
  >
      <div className="max-w-2xl mx-auto px-8">
        <div className="pointer-events-auto bg-black/70 backdrop-blur-lg border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
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
