/* V151 standalone test: all app localStorage access is namespaced.
   Never read or mutate any other GitHub Pages app storage. */
const localStorage=(()=>{
 'use strict';
 const native=window.localStorage, prefix='__coloastay_v151_integrated_trial__';
 const all=()=>Object.keys(native).filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length));
 return Object.freeze({
  getItem(k){return native.getItem(prefix+String(k))},
  setItem(k,v){native.setItem(prefix+String(k),String(v))},
  removeItem(k){native.removeItem(prefix+String(k))},
  key(i){return all()[i]??null},
  get length(){return all().length},
  clear(){throw Error('V151 không cho phép xóa toàn bộ kho bằng clear()')}
 });
})();
