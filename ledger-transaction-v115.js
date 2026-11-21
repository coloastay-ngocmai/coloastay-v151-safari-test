/* V115: explicit transaction gateway. NOT enabled for legacy writers. */
(function(root){'use strict';
const A=root.CLSAtomic101;
if(!A)throw Error('Missing atomic ledger module');
const KEYS=A.KEYS;
function validateAll(data){
 for(const k of KEYS){if(!Object.prototype.hasOwnProperty.call(data,k))throw Error('Missing ledger '+k);
  if(data[k]!==null){const obj=JSON.parse(data[k]);if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Invalid ledger '+k)}
 }
 const main=data[KEYS[0]]===null?null:JSON.parse(data[KEYS[0]]);
 if(main && (!Array.isArray(main.bookings)||!Array.isArray(main.receipts)||!Array.isArray(main.refunds)||!Array.isArray(main.cleanings)))throw Error('Incomplete booking ledger');
 return true;
}
function transact(store,changes){
 if(!changes||typeof changes!=='object'||Array.isArray(changes))throw Error('Invalid changes');
 const names=Object.keys(changes);
 if(!names.length||names.some(k=>!KEYS.includes(k)))throw Error('Unknown/empty ledger changes');
 return A.create(store,old=>{const next={...old};for(const k of names)next[k]=changes[k];validateAll(next);return next});
}
function readCommitted(store){const v=A.read(store);if(!v)return null;validateAll(v.data);return {...v.data};}
root.CLSLedger115={transact,readCommitted,validateAll,KEYS};
})(typeof window!=='undefined'?window:globalThis);
