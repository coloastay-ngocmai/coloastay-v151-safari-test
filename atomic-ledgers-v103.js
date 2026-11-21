/* Cổ Loa Stay V101: atomic snapshot protocol for ONE browser localStorage.
   Prototype only; legacy writers must be migrated before production use. */
(function(root){
'use strict';
const PREFIX='cls_v101_snapshot_';
const HEAD='cls_v101_committed';
const KEYS=['coloastay_homestay_v2_demo','coloastay_approval_v48_demo','coloastay_adjustments_v58_demo','coloastay_accounting_v60_demo','coloastay_v52_restore_journal'];
function checksum(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
function canonical(snapshot){return JSON.stringify(snapshot)}
function verify(raw){const e=JSON.parse(raw);if(!e||e.version!==101||!Number.isSafeInteger(e.sequence)||!e.data||typeof e.data!=='object'||Array.isArray(e.data)||!KEYS.every(k=>Object.prototype.hasOwnProperty.call(e.data,k)&& (e.data[k]===null||typeof e.data[k]==='string')))throw Error('Invalid snapshot');if(e.hash!==checksum(canonical({sequence:e.sequence,data:e.data})))throw Error('Snapshot checksum mismatch');return e}
function read(store){const id=store.getItem(HEAD);if(id===null)return null;if(!/^\d+$/.test(id))throw Error('Invalid commit pointer');const raw=store.getItem(PREFIX+id);if(raw===null)throw Error('Committed snapshot missing');const e=verify(raw);if(String(e.sequence)!==id)throw Error('Commit sequence mismatch');return e}
function create(store,transform){const old=read(store);const sequence=old?old.sequence+1:1;const data=old?{...old.data}:Object.fromEntries(KEYS.map(k=>[k,store.getItem(k)]));const next=transform({...data});if(!next||!KEYS.every(k=>Object.prototype.hasOwnProperty.call(next,k)))throw Error('Incomplete ledger set');for(const k of KEYS){if(next[k]!==null&&typeof next[k]!=='string')throw Error('Ledger must be serialized string or null: '+k);if(next[k]!==null){let v;try{v=JSON.parse(next[k])}catch(e){throw Error('Invalid ledger JSON: '+k)}if(v===null||typeof v!=='object')throw Error('Invalid ledger structure: '+k)}}const envelope={version:101,sequence,data:next,hash:checksum(canonical({sequence,data:next}))};const payload=JSON.stringify(envelope),key=PREFIX+sequence;const occupied=store.getItem(key);
// A failed HEAD write may leave an uncommitted staged slot. Reuse ONLY an identical,
// verified payload. Never overwrite a different slot or a committed snapshot.
if(occupied!==null){
 if(occupied!==payload)throw Error('Snapshot slot occupied by different data; refuse overwrite');
 const staged=verify(occupied);
 if(staged.sequence!==sequence)throw Error('Staged sequence mismatch');
}else store.setItem(key,payload);if(store.getItem(key)!==payload)throw Error('Staged snapshot failed verification');verify(store.getItem(key));store.setItem(HEAD,String(sequence));if(store.getItem(HEAD)!==String(sequence))throw Error('Commit pointer verification failed');return envelope}
function recover(store){return read(store)}
const api={KEYS,HEAD,PREFIX,read,create,recover,verify};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CLSAtomic101=api;
})(typeof module!=='undefined'&&module.exports?module.exports:window);
