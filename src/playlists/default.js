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
    /*if(typeof track === 'object'){
      if(track?.id) ids.push(track.id);
    }*/
    if(ids.includes(id)) {
      id++;
    }
    if(typeof track === 'string') {
      return {id : id, title : track.split('/').pop(), url : track, type : track.startsWith('http') ? 'remote' : 'local'};
    }
    return track;
  });
}

export const CURRENT_VERSION = '1.0.3'; // Update this when you want to trigger a reset
const playlist = [
  {id : '11', title : '29.11.2024_22h21 - Zuko Mix', url : 'https://cdn.zuko.pro/29.11.2024_22h21-Zuko.Mix.mp3', type : 'remote'},
  {id : '10', title : '02.11.2024 - Zuko mix', url : 'https://cdn.zuko.pro/2024_11_02_megred.mp3', type : 'remote'}, {
    id   : '9', title : 'Mixtape Một Mai Muộn Màng - Zuko mix 2020', url : 'https://cdn.zuko.pro/Mot-Mai-Muon-Mang_ Zuko_mixdown_total_rms_0.5.mp3',
    type : 'remote'
  }, {id : '333', title : 'Happy no birthday - Zuko mix', url : 'https://cdn.zuko.pro/Recording%202024.10.15%2020_51_34.mp3', type : 'remote'},
  {id : '8', title : 'Mixtape Nhạc Cổ Lùn 2088 - Zuko on the mix', url : 'https://cdn.zuko.pro/nhac%20co%20lun_test_mixdown.mp3', type : 'remote'},
  {id : '3', title : 'DJ Blue Sky - Han Mac Tu (Remix)', url : 'https://cdn.zuko.pro/DJ Blue Sky - Han Mac Tu (Remix) [High quality].mp3', type : 'remote'},
  {id : '2', title : 'Tôi là tôi 2013 - Koi Fish', url : 'https://cdn.zuko.pro/Tôi là tôi 2013 - Koi Fish.mp3', type : 'remote'},
  {id : '1', title : 'Dang Cay - T.H', url : 'https://cdn.zuko.pro/Dang Cay - T.H.wav', type : 'remote'}, {
    id  : '4', title : 'Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix',
    url : 'https://cdn.zuko.pro/Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix.mp3', type : 'remote'
  }, {
    id  : '5', title : 'Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky',
    url : 'https://cdn.zuko.pro/Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky.mp3', type : 'remote'
  }, {id : '6', title : 'full B\'Small remix', url : 'https://cdn.zuko.pro/full B\'Small remix.mp3', type : 'remote'},
];

export default playlist;
