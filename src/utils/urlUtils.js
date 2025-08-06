/**
 * --------------------------------------------------------------------------
 *
 * --------------------------------------------------------------------------
 * @PROJECT    : darkwave-visualizer-player
 * @AUTHOR     : Zuko <https://github.com/tansautn>
 * @LINK       : https://www.zuko.pro/
 * @FILE       : urlUtils.js

 * @CREATED    : 5:29 PM , 06/Aug/2025
 */

export function encodeUrl(url) {
  let uri = new URL(url);
  url = url.split('/').map((e) => url.indexOf(e) > url.indexOf(uri.hostname) ? encodeURIComponent(e) : e).join('/');
  return url;
}