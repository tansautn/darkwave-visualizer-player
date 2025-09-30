/**
 * --------------------------------------------------------------------------
 *
 * --------------------------------------------------------------------------
 * @PROJECT    : darkwave-visualizer-player
 * @AUTHOR     : Zuko <https://github.com/tansautn>
 * @LINK       : https://www.zuko.pro/
 * @FILE       : default.js
 * @CREATED    : 17:44 , 06/Dec/2024
 */
export function createPlaylistFromArray(playlist) {
  let id = 0;
  let ids = [];
  return playlist.map(track => {
    id++;
    while(ids.includes(id)) {
      id++;
    }
    if(typeof track === 'string') {
      return {id : id, title : track.split('/').pop(), url : track, type : track.startsWith('http') ? 'remote' : 'local'};
    }
    track.id = id;
    track.url = decodeURI(track.url);
    track.type = track.url.startsWith('http') ? 'remote' : 'local';
    if(!track.hasOwnProperty('title')) {
      track.title = track.url.split('/').pop();
    }
    track.title = track.title.replace('Zuko', '🇿🇺🇰🅾')
    return track;
  });
}

export const CURRENT_VERSION = '1.2.2'; // Update this when you want to trigger a reset
const playlist = [
  {
    title: 'One Way Ticket (Mixtape) - Zuko Mix',
    url: 'https://cdn.zuko.pro/mix/one way ticket_mixdown.mp3',
  },
  {
    title: 'Bánh Đa Cua (Mixtape) - Zuko Mix',
    url: 'https://cdn.zuko.pro/mix/banh-da-cua-mixtape-by-zuko.mp3',
  },
  {
    title: 'Stuck in the U.K (MiniTape) - Zuko Mix',
    url: 'https://cdn.zuko.pro/mix/Stuck in the UK_mixdown.mp3',
  },
  {
    title: 'Cau xay xong da lau ko co nguoi nao di qua 2019 - Zuko Mix',
    url: 'https://cdn.zuko.pro/mix/cau xay xong da lau ko co nguoi nao di qua.mp3',
  },
  {
    title: 'Xa 2019 - Zuko Mix',
    url: 'https://cdn.zuko.pro/mix/xa-2020_zuko-mix.mp3',
  },
  {
    title: 'Nhiều Lúc Anh Cứ Suy Diễn (Mixtape) - Zuko Mix[Vol #16]',
    url: 'https://cdn.zuko.pro/mix/Nhiều Lúc Anh Cứ Suy Diễn (Mixtape) - Zuko [Vol #16].mp3',
  },
  {
    title : '[24bits] Không Có Em Tôi Như Mất Cả Thế Giới (Mixtape) - Zuko Mix',
    url   : 'https://archive.org/download/khong-co-em-toi-nhu-mat-ca-the-gioi-mixtape-zuko-mix-24bits/Kh%C3%B4ng%20C%C3%B3%20Em%20T%C3%B4i%20Nh%C6%B0%20M%E1%BA%A5t%20C%E1%BA%A3%20Th%E1%BA%BF%20Gi%E1%BB%9Bi%20%28Mixtape%29%20-%20Zuko%20Mix%20%5B24bits%5D.mp3'
  },
  {title : 'Closed A Road Block [TEST] - B Small', url : 'https://cdn.zuko.pro/musics/trance/Closed A Road Block [TEST] - B Small.mp3'},
  {title : 'Lướt Sóng Đạp Mây - Ben', url : 'https://cdn.zuko.pro/musics/viet-remixes/Luot Song Dap May - Ben Heineken x Teddy_01.mp3'},
  {title : 'Sài Gòn 9 - Linh Ku', url : 'https://cdn.zuko.pro/musics/viet-remixes/Sài Gòn Night - DJ Linh Ku.mp3'},
  {title : 'full B\'Small remix', url : 'https://cdn.zuko.pro/full B\'Small remix.mp3'},
  {title : 'Recording 2020.05.06 06_15_39.wav - Zuko Mix', url : 'https://cdn.zuko.pro/mix/Recording%202020.05.06%2006_15_39.wav'},
  {title : 'Neu mot ngay - Zuko Mix', url : 'https://cdn.zuko.pro/neu-mot-ngay-zuko-mix-96k24bits.mp3'},
  {title : '29.11.2024_22h21 - Zuko Mix', url : 'https://cdn.zuko.pro/29.11.2024_22h21-Zuko.Mix.mp3'},
  {title : '02.11.2024 - Zuko mix', url : 'https://cdn.zuko.pro/2024_11_02_megred.mp3'},
  {title : 'Mixtape Một Mai Muộn Màng - Zuko mix 2020', url : 'https://cdn.zuko.pro/Mot-Mai-Muon-Mang_ Zuko_mixdown_total_rms_0.5.mp3'},
  {title : 'Happy no birthday - Zuko mix', url : 'https://cdn.zuko.pro/Recording%202024.10.15%2020_51_34.mp3'},
  {title : 'Mixtape Nhạc Cổ Lùn 2088 - Zuko on the mix', url : 'https://cdn.zuko.pro/nhac%20co%20lun_test_mixdown.mp3'},
  {title : 'Zuko a.k.a DJ Blue Sky - Han Mac Tu (Remix)', url : 'https://cdn.zuko.pro/DJ Blue Sky - Han Mac Tu (Remix) [High quality].mp3'},
  {title : 'Tôi là tôi 2013 - Koi Fish', url : 'https://cdn.zuko.pro/Tôi là tôi 2013 - Koi Fish.mp3'},
  {title : 'Dang Cay - T.H', url : 'https://cdn.zuko.pro/Dang Cay - T.H.wav'},
  {title : 'Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix', url : 'https://cdn.zuko.pro/Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix.mp3'},
  {
    title : 'Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky',
    url   : 'https://cdn.zuko.pro/Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky.mp3'
  },
];

export default createPlaylistFromArray(playlist);
