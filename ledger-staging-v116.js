/* V116: staging adapter for migrating legacy writers, disabled until all readers use committed snapshots. */
(function(root){'use strict';
const G=root.CLSLedger115;
function stage(store,operation){
 if(!G)throw Error('Thiếu cổng lưu chung');
 const committed=G.readCommitted(store);
 const values=committed||Object.fromEntries(G.KEYS.map(k=>[k,store.getItem(k)]));
 const changed=new Set();
 const adapter={
  getItem(k){return Object.prototype.hasOwnProperty.call(values,k)?values[k]:store.getItem(k)},
  setItem(k,v){if(!G.KEYS.includes(k))throw Error('Đường ghi chưa chuyển đổi: '+k);values[k]=String(v);changed.add(k)},
  removeItem(k){if(!G.KEYS.includes(k))throw Error('Đường xóa chưa chuyển đổi: '+k);values[k]=null;changed.add(k)}
 };
 const result=operation(adapter);
 if(result&&typeof result.then==='function')throw Error('Chưa hỗ trợ ghi bất đồng bộ');
 if(!changed.size)throw Error('Không có thay đổi để lưu');
 const changes=Object.fromEntries([...changed].map(k=>[k,values[k]]));
 const envelope=G.transact(store,changes);
 const readback=G.readCommitted(store);
 for(const k of changed)if(readback[k]!==values[k])throw Error('Bản đã xác nhận không khớp: '+k);
 return {result,sequence:envelope.sequence,changed:[...changed]};
}
root.CLSLedgerStaging116={stage};
})(typeof window!=='undefined'?window:globalThis);
