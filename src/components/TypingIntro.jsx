import {useEffect, useRef, useState} from 'react';

const TYPING_SPEED_MS = 50;    // per character
const SECTION_HOLD_MS = 2800;  // read time after a section finishes typing
const OUTRO_HOLD_MS = 2000;    // read time on the last section before fading
const FADE_MS = 1000;          // keep in sync with duration-1000 on the overlay

const INTRO_SECTIONS = [
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

const Caret = () => (
  <span aria-hidden="true" className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse bg-current" />
);

/**
 * Typed layer over an invisible full-text layer in the same grid cell: the
 * card is sized by the full text up front, so lines never reflow or jump
 * while the reader follows the caret.
 */
const TypedBlock = ({as: Tag, full, typed, showCaret, className}) => (
  <Tag className={`grid ${className}`}>
    <span aria-hidden="true" className="invisible col-start-1 row-start-1">{full}</span>
    <span aria-hidden="true" className="col-start-1 row-start-1">
      {typed}
      {showCaret && <Caret />}
    </span>
  </Tag>
);

const TypingIntro = ({onComplete}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [typed, setTyped] = useState(0); // characters typed in the current section (title + content)
  const [isFading, setIsFading] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Hiệu ứng typing
  useEffect(() => {
    if(isFading) return;
    const timers = [];

    if(currentSection >= INTRO_SECTIONS.length) {
      // Kết thúc intro, giữ section cuối để đọc rồi fade out
      timers.push(setTimeout(() => setIsFading(true), OUTRO_HOLD_MS));
      return () => timers.forEach(clearTimeout);
    }

    const {title, content} = INTRO_SECTIONS[currentSection];
    const total = title.length + content.length;
    let index = 0;
    const typingInterval = setInterval(() => {
      index++;
      setTyped(index);
      if(index >= total) {
        clearInterval(typingInterval);
        // Chuyển sang section tiếp theo sau SECTION_HOLD_MS
        timers.push(setTimeout(() => {
          setTyped(0);
          setCurrentSection(section => section + 1);
        }, SECTION_HOLD_MS));
      }
    }, TYPING_SPEED_MS);

    return () => {
      clearInterval(typingInterval);
      timers.forEach(clearTimeout);
    };
  }, [currentSection, isFading]);

  // Fade out xong mới báo cho parent unmount
  useEffect(() => {
    if(!isFading) return;
    const timeout = setTimeout(() => onCompleteRef.current?.(), FADE_MS);
    return () => clearTimeout(timeout);
  }, [isFading]);

  const finished = currentSection >= INTRO_SECTIONS.length;
  const sectionIndex = Math.min(currentSection, INTRO_SECTIONS.length - 1);
  const section = INTRO_SECTIONS[sectionIndex];
  const typedCount = finished ? Infinity : typed;
  const typingTitle = typedCount < section.title.length;

  return (
  <div
  className={`pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/45 transition-opacity duration-1000 ${
  isFading ? 'opacity-0' : 'opacity-100'
  }`}
  >
      <div className="mx-auto w-full max-w-2xl px-4 md:px-8">
        <div className="pointer-events-auto rounded-3xl border border-white/10 bg-zinc-950/80 p-7 font-ui text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/5 backdrop-blur-xl md:p-12">
          <p className="sr-only" aria-live="polite">{`${section.title}. ${section.content}`}</p>

          <div className="mb-4 font-mono text-ui-2xs font-medium uppercase tracking-[0.24em] text-white/45">
            {String(sectionIndex + 1).padStart(2, '0')} / {String(INTRO_SECTIONS.length).padStart(2, '0')}
          </div>

          <TypedBlock
            as="h2"
            full={section.title}
            typed={section.title.slice(0, typedCount)}
            showCaret={typingTitle}
            className="mb-4 text-ui-2xl font-extrabold leading-tight tracking-tight text-white md:text-ui-3xl"
          />
          <TypedBlock
            as="p"
            full={section.content}
            typed={section.content.slice(0, Math.max(0, typedCount - section.title.length))}
            showCaret={!typingTitle}
            className="max-w-[60ch] whitespace-pre-line text-ui-base font-normal leading-[1.75] text-white/85 md:text-ui-lg"
          />

          {/* Progress dots */}
          <div className="mt-8 flex justify-center gap-2 md:mt-10">
            {INTRO_SECTIONS.map((_, idx) => (
            <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
            idx === sectionIndex
            ? 'w-8 bg-white'
            : idx < sectionIndex
              ? 'w-1.5 bg-white/50'
              : 'w-1.5 bg-white/20'
            }`}
            />
            ))}
          </div>

          {/* Skip button */}
          <div className="mt-6 flex justify-center">
            <button
            type="button"
            onClick={() => setIsFading(true)}
            className="rounded-md px-2 py-1 text-ui-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Bỏ qua intro →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIntro;
