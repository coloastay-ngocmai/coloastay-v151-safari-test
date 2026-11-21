/* V126: validate V69 on a shadow store, commit all five authoritative ledgers,
   then refresh legacy mirrors. Never change HEAD on failed preflight. */
(function(root){'use strict';
const G=root.CLSLedger115, M=root.CLSMirrorRestore125;
const K={main:'coloastay_homestay_v2_demo',approval:'coloastay_approval_v48_demo',adjust:'coloastay_adjustments_v58_demo',account:'coloastay_accounting_v60_demo',journal:'coloastay_v52_restore_journal'};
function restore(store,x,approved){
 if(approved!==true)throw Error('Cần xác nhận khôi phục');
 if(!G||!M||!root.CLSBackup69)throw Error('Thiếu bộ lưu chung');
 const committed=G.readCommitted(store);
 if(!committed)throw Error('Chưa có bản lưu chung; không dùng chức năng này');
 if(M.inspect(store).changes.length)throw Error('Sổ đọc đang lệch; cần xử lý trước khi nhập');
 const original=Object.fromEntries(G.KEYS.map(k=>[k,store.getItem(k)]));
 const sourceKey='coloastay_approval_v48_demo_source';
 const source=store.getItem(sourceKey);
 const shadow=new Map([...Object.entries(original),[sourceKey,source]]);
 const mock={getItem:k=>shadow.has(k)?shadow.get(k):null,setItem:(k,v)=>shadow.set(k,String(v)),removeItem:k=>shadow.delete(k)};
 // Existing V69 anti-rollback and protected-entry checks run on the shadow only.
 root.CLSBackup69.restore(mock,K.main,x);
 const changes={};for(const key of G.KEYS)changes[key]=mock.getItem(key);
 G.validateAll(changes);
 const result=G.transact(store,changes);
 // HEAD is authoritative after this point. A mirror failure must be reported,
 // never roll back HEAD or falsely claim that restore was undone.
 try{
  M.restoreMirrors(store,true);
  const nextSource=mock.getItem(sourceKey);
  if(nextSource===null)store.removeItem(sourceKey);else store.setItem(sourceKey,nextSource);
  if(store.getItem(sourceKey)!==nextSource)throw Error('Chữ ký nguồn chưa được đồng bộ');
  if(M.inspect(store).changes.length)throw Error('Sổ đọc chưa khớp');
 }catch(e){throw Error('Bản xác nhận đã cập nhật nhưng sổ đọc chưa đồng bộ: '+e.message+'; dừng thao tác và khôi phục sổ đọc');}
 return {sequence:result.sequence,main:JSON.parse(changes[K.main])};
}
root.CLSRestore126={restore};
})(typeof window!=='undefined'?window:globalThis);
