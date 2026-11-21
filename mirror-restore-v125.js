/* V125: explicit recovery of legacy read mirrors from one verified committed snapshot.
   No silent restore. Does not change committed HEAD. Browser localStorage only. */
(function(root){'use strict';
const gateway=root.CLSLedger115;
function inspect(store){
 if(!gateway)throw Error('Thiếu bộ lưu chung');
 const data=gateway.readCommitted(store);
 if(!data)throw Error('Chưa có bản lưu chung đã xác nhận');
 gateway.validateAll(data);
 const changes=gateway.KEYS.filter(k=>store.getItem(k)!==data[k]);
 return {data,changes};
}
function restoreMirrors(store,approved){
 if(approved!==true)throw Error('Cần xác nhận khôi phục thủ công');
 const plan=inspect(store);
 const before=Object.fromEntries(gateway.KEYS.map(k=>[k,store.getItem(k)]));
 if(!plan.changes.length)return {restored:0};
 try{
  for(const key of plan.changes){
   const value=plan.data[key];
   if(value===null)store.removeItem(key);else store.setItem(key,value);
   if(store.getItem(key)!==value)throw Error('Không xác nhận được sổ '+key);
  }
  const after=inspect(store);
  if(after.changes.length)throw Error('Các sổ chưa khớp sau khôi phục');
  return {restored:plan.changes.length};
 }catch(e){
  let rollbackFailed=false;
  for(const key of gateway.KEYS){try{
   const value=before[key];if(value===null)store.removeItem(key);else store.setItem(key,value);
   if(store.getItem(key)!==value)rollbackFailed=true;
  }catch(_){rollbackFailed=true}}
  if(rollbackFailed)throw Error('Khôi phục thất bại và không hoàn nguyên được mọi sổ: '+e.message);
  throw e;
 }
}
root.CLSMirrorRestore125={inspect,restoreMirrors};
})(typeof window!=='undefined'?window:globalThis);
