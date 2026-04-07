<a href="http://zuko.pro/">
    <img src="https://avatars0.githubusercontent.com/u/6666271?v=3&s=96" alt="Z-Logo"
         title="Halu Universe" align="right" />
</a>
# dmp

# 🌑 Darkwave Music Player

> **Live at → [zuko.pro](https://zuko.pro)**

A browser-based music player built for people who care about audio quality and atmosphere.

Trình phát nhạc chạy trên trình duyệt, dành cho những ai quan tâm đến chất lượng âm thanh và không khí nghe nhạc.

---

## 🌐 Language / Ngôn ngữ

- [English](#-english)
- [Tiếng Việt](#-tiếng-việt)

---

## 🇬🇧 English

### Why this exists

This project was born with exactly two goals in mind:

1. **Listen to — and show off — music online or offline at the highest possible quality.**
   - Works on any device with a browser. Yes, including a Sony TV. It has been tested.
   - ⚠️ There is currently a known playback bug on iOS 14 browsers. The author uses one. The irony is not lost on him.

2. **Run a real Milkdrop visualizer directly in the browser** — no plugins, no Winamp, just the web.
   (Shadertoy bridging may come later, depending on motivation and available lifetimes.)

---

### ✨ Features

#### 🎧 Audio Player

| Format | Support |
|---|---|
| WAV | ✅ *(browser-dependent — looking at you, Chromium)* |
| WMA, M4A, MPEG, HLS | ✅ |
| FLAC, OGG | 🗺️ Roadmap |
| SoundCloud playback | 🗺️ Planned *(pending an API key the author hasn't gotten around to)* |

- **Autoplay** is supported — but only after the first user gesture, because browsers said so and there's nothing anyone can do about it. ¯\_(ツ)_/¯

#### 📋 Playlist

- Playlists are saved **locally on your device** (no server, no cloud, no drama).
- Click the **Upload icon** to load local audio files directly into your playlist. The files never leave your machine — they just get referenced temporarily. On your next visit, they'll be gone from the playlist (but still sitting safely wherever you put them).
- **Drag & drop reordering** — sort your queue manually, the way it was meant to be done.

#### 🌊 Milkdrop Visualizer

- Full-screen canvas visualizer, truly focused on the music.
- Overlay controls (player, playlist) stay at **< 90% opacity** — they're there when you need them, and barely there when you don't.
- Preset selection is currently **always shuffle mode**. Manual cycle control is in the hotkey system (it's coded, it's just... on the list).

---

### 🗺️ Roadmap / TODO

#### Player
- [ ] HQ codec support: FLAC, OGG
- [ ] Stream from YouTube (video suppressed, audio quality improved)
- [ ] Hotkey shortcuts *(implemented but not behaving — back to the drawing board)*

#### Playlist
- [ ] Multiple saved playlists via **IndexedDB**

#### Visualizer
- [ ] Shadertoy bridging — decompile and play shaders directly in the browser
- [ ] Local preset management

---

### 📝 Notes

> **1. On browser audio quality**
>
> After testing across browsers, the best audio quality and broadest format support — as far as the author knows — is **Firefox**.
>
> Audio decoding in browsers is handled by plugins. Chromium's default is, to put it diplomatically, *not great*. Many media players ship browser plugins that improve this significantly. **K-Lite Codec** is one example worth considering — call it a media player if you want, the author won't argue.

> **2. On the Upload button**
>
> Despite the icon, nothing actually gets uploaded anywhere. Files stay on your machine. Think of it as "point at this file and play it." On your next visit, the reference is cleared from the playlist — the file itself is untouched.

> **3. On Autoplay**
>
> Browser security policy prohibits audio autoplay before user interaction. This is a browser limitation, not a bug in this player. The feature works correctly once you've touched anything on the page.

> **4. On Visualizer preset cycling**
>
> Currently, users cannot manually choose how presets are selected. It's always shuffle. Cycle mode is wired into the hotkey system but not yet exposed in the UI — it's on the list.

---

## 🇻🇳 Tiếng Việt

### Tại sao dự án này tồn tại

Dự án ra đời với đúng hai mục tiêu:

1. **Nghe — và khoe — nhạc online/offline với chất lượng cao nhất có thể.**
   - Phục vụ mọi loại thiết bị, miễn là có trình duyệt web. Kể cả TV Sony. Đã được kiểm chứng thực tế.
   - ⚠️ Hiện có 1 lỗi playback trên trình duyệt của thiết bị iOS 14. Tác giả đang dùng cái đó. Đúng, thật trớ trêu.

2. **Chạy Milkdrop visualizer thực sự ngay trên trình duyệt** — không cần plugin, không cần Winamp, chỉ cần web.
   (Shadertoy bridging có thể sẽ đến sau, tùy vào động lực và số kiếp còn lại của tác giả.)

---

### ✨ Tính năng

#### 🎧 Trình phát âm thanh

| Định dạng | Hỗ trợ |
|---|---|
| WAV | ✅ *(tùy trình duyệt — Chromium thì... lêu lêu)* |
| WMA, M4A, MPEG, HLS | ✅ |
| FLAC, OGG | 🗺️ Roadmap |
| Phát từ SoundCloud | 🗺️ Đã lên kế hoạch *(đang chờ API key mà tác giả chưa xin)* |

- **Autoplay** được hỗ trợ — nhưng chỉ sau khi người dùng tương tác lần đầu tiên, vì trình duyệt bắt vậy và không ai làm gì được. ¯\_(ツ)_/¯

#### 📋 Danh sách phát

- Playlist được lưu **cục bộ trên máy bạn** — không server, không cloud, không drama.
- Nhấn nút **icon Upload** để tải file âm thanh trực tiếp vào playlist. File không đi đâu cả, chỉ được tham chiếu tạm thời. Lần sau truy cập, tham chiếu sẽ bị xóa — file vẫn nằm yên chỗ cũ.
- **Kéo thả để sắp xếp** — tự tay sắp lại thứ tự bài trong danh sách phát.

#### 🌊 Milkdrop Visualizer

- Visualizer toàn màn hình, tập trung hoàn toàn vào âm nhạc.
- Các điều khiển overlay (player, playlist) luôn ở **độ mờ < 90%** — có khi cần, mờ khi không.
- Hiện tại preset luôn chọn theo **chế độ shuffle**. Chế độ cycle đã có trong hệ thống hotkey, chỉ chưa lộ ra ngoài UI thôi.

---

### 🗺️ Kế hoạch phát triển

#### Player
- [ ] Hỗ trợ codec chất lượng cao: FLAC, OGG
- [ ] Stream từ YouTube (tắt kênh video, cải thiện chất lượng âm thanh đầu ra)
- [ ] Phím tắt *(đã implement nhưng chưa hoạt động đúng ý — đang xem lại)*

#### Playlist
- [ ] Nhiều danh sách phát được lưu qua **IndexedDB**

#### Visualizer
- [ ] Shadertoy bridging — decompile và phát shader trực tiếp trên trình duyệt
- [ ] Quản lý preset cục bộ

---

### 📝 Ghi chú

> **1. Về chất lượng âm thanh trên trình duyệt**
>
> Sau khi thử qua đủ loại trình duyệt, chất lượng âm thanh tốt nhất và hỗ trợ nhiều định dạng nhất — tính đến thời điểm tác giả biết — là **Firefox**.
>
> Việc decode audio trên trình duyệt được thực hiện qua plugin. Plugin mặc định của Chromium thì... không được tốt. Nhiều media player có kèm plugin cho trình duyệt, giúp cải thiện điều này đáng kể. **K-Lite Codec** là một ví dụ — gọi nó là media player cũng được, tác giả không cãi.

> **2. Về nút Upload**
>
> Dù icon là mũi tên upload, file thực sự không đi đâu cả. Hiểu đơn giản là "trỏ vào file này và phát nó lên." Lần sau vào trang, tham chiếu sẽ bị xóa khỏi playlist — file vẫn nguyên vẹn trên máy bạn.

> **3. Về Autoplay**
>
> Chính sách bảo mật của trình duyệt không cho phép tự động phát âm thanh trước khi người dùng tương tác. Đây là giới hạn của trình duyệt, không phải lỗi của player. Tính năng hoạt động bình thường sau khi bạn chạm vào bất kỳ thứ gì trên trang.

> **4. Về chọn preset visualizer**
>
> Hiện tại người dùng chưa thể chọn cách preset được lựa chọn. Luôn là shuffle. Chế độ cycle đã được code vào hệ thống hotkey nhưng chưa có trong UI — nằm trong danh sách việc cần làm rồi ^^

---

## 🛠️ Tech Stack

- **Framework:** Next.js (React)
- **Visualizer:** Milkdrop (WebGL / canvas)
- **Storage:** LocalStorage, IndexedDB *(planned)*
- **Audio:** Web Audio API

---

## 📄 License

- Chưa biết chọn license gì cho "passion" cả

---

<p align="center">Made with 🖤 and a lot of opinions about audio quality.</p>