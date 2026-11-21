/* V114: Kiểm tra tính nhất quán nghiệp vụ trước khi ghi kho chính. */
(function(root){'use strict';
function check(db){
 const errors=[];
 const arrays=['houses','bookings','receipts','refunds','cleanings','costs'];
 for(const k of arrays)if(!Array.isArray(db[k]))errors.push('Thiếu danh sách '+k);
 if(errors.length)return errors;
 const bookings=new Map(db.bookings.map(x=>[x.id,x]));
 const rooms=new Set(db.houses.map(x=>x.id));
 const unique=(items,label)=>{const seen=new Set();for(const x of items){if(!x.id||seen.has(x.id))errors.push('Trùng hoặc thiếu mã '+label);seen.add(x.id)}};
 for(const k of arrays)unique(db[k],k);
 for(const b of db.bookings){
  if(!rooms.has(b.house))errors.push('Đặt phòng không có phòng: '+b.id);
  if(!(b.start<b.end))errors.push('Ngày nhận/trả không hợp lệ: '+b.id);
  for(const k of ['total','deposit','discount','extra'])if(b[k]!==undefined&&(!Number.isSafeInteger(Number(b[k]))||Number(b[k])<0))errors.push('Tiền không hợp lệ '+k+': '+b.id);
 }
 for(const k of ['receipts','refunds'])for(const t of db[k]){
  if(!bookings.has(t.booking))errors.push('Chứng từ '+k+' thiếu đơn: '+t.id);
  if(!Number.isSafeInteger(Number(t.amount))||Number(t.amount)<=0)errors.push('Chứng từ '+k+' có số tiền sai: '+t.id);
 }
 const cleanings=new Set();for(const t of db.cleanings){
  if(t.bookingId){if(!bookings.has(t.bookingId))errors.push('Dọn phòng thiếu đơn: '+t.id);
   if(cleanings.has(t.bookingId))errors.push('Trùng dọn phòng cho đơn: '+t.bookingId);cleanings.add(t.bookingId)}
 }
 return errors;
}
const api={check};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CLSConsistency114=api;
})(typeof module!=='undefined'&&module.exports?module.exports:window);
