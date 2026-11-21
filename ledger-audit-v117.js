/* V117: audit of committed-vs-legacy ledgers and safe explicit restore planning.
   This does NOT switch legacy writers or silently overwrite financial records. */
(function(root){'use strict';
const G=root.CLSLedger115;
function inspect(store){
 if(!G)throw Error('Thiếu bộ giao dịch V115');
 const committed=G.readCommitted(store);
 const keys=G.KEYS;
 const rows=keys.map(key=>{
  const live=store.getItem(key), saved=committed?committed[key]:null;
  let liveValid=true,savedValid=true;
  try{if(live!==null)JSON.parse(live)}catch(e){liveValid=false}
  try{if(saved!==null)JSON.parse(saved)}catch(e){savedValid=false}
  return {key,legacyPresent:live!==null,committedPresent:saved!==null,legacyValid:liveValid,committedValid:savedValid,identical:committed!==null&&live===saved};
 });
 return {hasCommit:!!committed,rows,ready:!!committed&&rows.every(x=>x.identical&&x.legacyValid&&x.committedValid)};
}
function prepareRestore(store,raw){
 if(!G)throw Error('Thiếu bộ giao dịch V115');
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Bản sao không hợp lệ');
 const data={};for(const key of G.KEYS){
  if(!Object.prototype.hasOwnProperty.call(raw,key))throw Error('Bản sao thiếu sổ '+key);
  const v=raw[key];if(v!==null&&typeof v!=='string')throw Error('Sổ phải là chuỗi JSON hoặc null: '+key);
  data[key]=v;
 }
 G.validateAll(data);
 const current=G.readCommitted(store);
 return {data,changes:G.KEYS.filter(k=>!current||current[k]!==data[k]),requiresManualApproval:true};
}
root.CLSLedgerAudit117={inspect,prepareRestore};
})(typeof window!=='undefined'?window:globalThis);
