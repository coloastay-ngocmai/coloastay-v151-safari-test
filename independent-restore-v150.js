/* V150 test-only: restore an independently exported committed snapshot into an EMPTY browser store. */
(function(root){'use strict';
const A=root.CLSAtomic101,G=root.CLSLedger115,M=root.CLSMirrorRestore125;
function prepare(pkg){
 if(!A||!G||!M)throw Error('Thiếu thành phần lưu dữ liệu');
 if(!pkg||pkg.format!=='coloastay-independent-readonly-1'||!pkg.items||typeof pkg.items!=='object'||Array.isArray(pkg.items))throw Error('Sai định dạng JSON độc lập');
 const id=pkg.committedSequence;
 if(typeof id!=='string'||!/^[1-9]\d*$/.test(id)||pkg.items[A.HEAD]!==id)throw Error('Sai mã bản xác nhận');
 const raw=pkg.items[A.PREFIX+id];if(typeof raw!=='string')throw Error('Thiếu bản xác nhận');
 const snap=A.verify(raw);if(String(snap.sequence)!==id)throw Error('Sai thứ tự bản xác nhận');
 G.validateAll(snap.data);
 const checks=[['Sổ duyệt V48',G.KEYS[1],root.CLS44],['Sổ điều chỉnh V58',G.KEYS[2],root.CLSAdjust58],['Sổ kế toán V60',G.KEYS[3],root.CLSAccounting60]];
 for(const [label,key,validator] of checks){
  if(!validator||typeof validator.valid!=='function')throw Error('Thiếu bộ kiểm tra '+label);
  if(typeof snap.data[key]!=='string')throw Error(label+': thiếu dữ liệu');
  let ledger;try{ledger=JSON.parse(snap.data[key])}catch(e){throw Error(label+': JSON không hợp lệ')}
  try{validator.valid(ledger)}catch(e){throw Error(label+': '+e.message)}
 }
 for(const key of G.KEYS){if(!Object.prototype.hasOwnProperty.call(pkg.items,key)||pkg.items[key]!==snap.data[key])throw Error('Sổ đọc không khớp bản xác nhận: '+key)}
 const main=JSON.parse(snap.data[G.KEYS[0]]);
 if(!main||!Array.isArray(main.houses)||!Array.isArray(main.bookings)||!Array.isArray(main.receipts)||!Array.isArray(main.refunds)||!Array.isArray(main.costs))throw Error('Sổ đặt phòng không đầy đủ');
 const bookingIds=new Set(main.bookings.map(b=>b.id));
 if(bookingIds.size!==main.bookings.length)throw Error('Trùng mã đơn');
 const receiptIds=new Set();for(const r of main.receipts){if(!bookingIds.has(r.booking)||!Number.isSafeInteger(Number(r.amount))||Number(r.amount)<=0||receiptIds.has(r.id))throw Error('Chứng từ thu không hợp lệ hoặc trùng');receiptIds.add(r.id)}
 return {data:snap.data,summary:{sequence:snap.sequence,houses:main.houses.length,bookings:main.bookings.length,receipts:main.receipts.length,costs:main.costs.length}};
}
function empty(store){if(A.read(store))return false;return [A.HEAD,...G.KEYS].every(k=>store.getItem(k)===null)}
function restoreEmpty(store,pkg,approved){if(approved!==true)throw Error('Chưa xác nhận');const plan=prepare(pkg);if(!empty(store))throw Error('Chỉ cho phép khôi phục vào kho hoàn toàn trống');
 // Committed snapshot is the source of truth. If mirror syncing fails, leave HEAD intact and lock UI for explicit recovery.
 const committed=G.transact(store,plan.data);
 const result=M.restoreMirrors(store,true);
 const verified=G.readCommitted(store);for(const k of G.KEYS)if(verified[k]!==plan.data[k]||store.getItem(k)!==plan.data[k])throw Error('Đối chiếu sau phục hồi không khớp: '+k);
 return {sequence:committed.sequence,mirrors:result.restored,...plan.summary};
}
root.CLSIndependentRestore150={prepare,empty,restoreEmpty};
})(typeof window!=='undefined'?window:globalThis);
