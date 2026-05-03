import React, {useState} from 'react';

const STEPS = [
  {
    title   : '👋 Chào mừng!',
    content : 'Darkwave Music Player — trình phát nhạc với Milkdrop visualizer chạy thẳng trên trình duyệt, không plugin.\nCùng khám phá các tính năng nhé.',
  },
  {
    title   : '🌊 Visualizer',
    content : 'Toàn màn hình phía sau là Milkdrop visualizer đang chạy theo nhịp nhạc.\n\nNhấn  ←  →  để chuyển preset thủ công.\nPreset tự động đổi mỗi 18 giây theo chế độ shuffle.',
  },
  {
    title   : '🎵 Phím tắt',
    content : 'Space    — Play / Pause\n↑  ↓      — Bài tiếp / Bài trước\n←  →      — Preset visualizer\nEnter     — Thêm track SoundCloud\nShift+Enter — Mở dialog upload file',
  },
  {
    title   : '📋 Playlist',
    content : 'Nhấn nút ☰ (List) để mở / đóng playlist.\nKéo thả tay cầm ⠿ để sắp xếp lại thứ tự.\nNhấn tên bài để phát ngay.',
  },
  {
    title   : '📂 Thêm nhạc',
    content : 'Nhấn nút ↑ (Upload) để thêm file âm thanh từ máy.\nFile không bị tải lên server — chỉ phát cục bộ trong phiên này.\nLần sau vào trang, tham chiếu sẽ tự xóa.',
  },
  {
    title   : '💾 Xuất playlist',
    content : 'Nhấn nút ↓ (Download) để xuất playlist ra file .m3u8.\nĐịnh dạng tương thích với hầu hết trình phát nhạc desktop.',
  },
];

const GuidanceWizard = ({onClose}) => {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900/95 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white/40 text-sm font-mono">{step + 1} / {STEPS.length}</span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <h2 className="text-white text-lg font-semibold mb-3">{current.title}</h2>
        <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans mb-8">
          {current.content}
        </pre>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === step ? 'bg-white w-6' : 'bg-white/30 w-1.5'}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors text-sm"
            >
              ← Trước
            </button>
          )}
          <button
            onClick={isLast ? onClose : () => setStep(s => s + 1)}
            className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm font-medium"
          >
            {isLast ? 'Bắt đầu →' : 'Tiếp →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidanceWizard;
