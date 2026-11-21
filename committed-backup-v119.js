/* V119: explicit, non-destructive backup/restore of committed snapshot.
   Legacy readers/writers remain disabled from using this as canonical source. */
(function(root){'use strict';
const G=root.CLSLedger115;
function gateway(){if(!G)throw Error('Thiếu cổng lưu chung V115');return G}
function exportCommitted(store){
 const data=gateway().readCommitted(store);
 if(!data)throw Error('Chưa có bản lưu chung đã xác nhận');
 return JSON.stringify({format:'coloastay-committed-backup',version:119,ledgers:data});
}
function inspectBackup(raw){
 const backup=typeof raw==='string'?JSON.parse(raw):raw;
 if(!backup||backup.format!=='coloastay-committed-backup'||backup.version!==119||!backup.ledgers||typeof backup.ledgers!=='object'||Array.isArray(backup.ledgers))throw Error('Sai định dạng bản sao V119');
 const keys=gateway().KEYS;
 if(Object.keys(backup.ledgers).length!==keys.length)throw Error('Bản sao có sổ lạ hoặc thiếu sổ');
 gateway().validateAll(backup.ledgers);
 return {ledgers:{...backup.ledgers},keys:[...keys],requiresManualApproval:true};
}
function restoreCommitted(store,raw,approved){
 if(approved!==true)throw Error('Cần xác nhận khôi phục rõ ràng');
 const plan=inspectBackup(raw);
 // Fail closed if any committed snapshot already exists; never overwrite automatically.
 if(gateway().readCommitted(store)!==null)throw Error('Đã có bản xác nhận; không tự ghi đè khi khôi phục');
 const changes=Object.fromEntries(plan.keys.map(k=>[k,plan.ledgers[k]]));
 const envelope=gateway().transact(store,changes);
 const check=gateway().readCommitted(store);
 for(const k of plan.keys)if(check[k]!==changes[k])throw Error('Khôi phục chưa được xác minh: '+k);
 return {sequence:envelope.sequence};
}
root.CLSCommittedBackup119={exportCommitted,inspectBackup,restoreCommitted};
})(typeof window!=='undefined'?window:globalThis);
