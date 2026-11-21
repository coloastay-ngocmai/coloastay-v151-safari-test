(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CLSDebt65=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function calculate(bookings,receipts,refunds,cancellations,scope){
if(![bookings,receipts,refunds,cancellations].every(Array.isArray))throw Error('Thiếu bảng dữ liệu');
const unique=(rows,name)=>{let s=new Set();for(let r of rows){if(!r||!r.id||s.has(r.id))throw Error('Trùng/thiếu mã '+name);s.add(r.id)}};
unique(bookings,'đặt phòng');unique(receipts,'thu');unique(refunds,'hoàn');unique(cancellations,'hủy');
const ids=new Set(bookings.map(b=>b.id));for(let x of [...receipts,...refunds,...cancellations])if(!ids.has(x.booking))throw Error('Chứng từ mồ côi');
const integer=(x,name)=>{if(!Number.isSafeInteger(x)||x<0)throw Error('Tiền không hợp lệ: '+name);return x};
let out={count:0,entitled:0,collected:0,refunded:0,net:0,due:0,refundDue:0,unverified:0,errors:[],rows:[]};
for(let b of bookings){if(scope&&String(b.start||'').slice(0,7)!==scope)continue;
const total=integer(Number(b.total),'tổng'),deposit=integer(Number(b.deposit||0),'cọc');let paid=deposit,returned=0;
for(let r of receipts.filter(x=>x.booking===b.id))paid+=integer(Number(r.amount),'thu');for(let r of refunds.filter(x=>x.booking===b.id))returned+=integer(Number(r.amount),'hoàn');
const canc=cancellations.filter(x=>x.booking===b.id),cancelled=b.status==='Hủy';if(canc.length>1)throw Error('Trùng chính sách hủy');
const entitled=cancelled&&canc.length?integer(Number(canc[0].entitled),'giữ khi hủy'):cancelled?0:total;
if(entitled>total||returned>paid)throw Error('Số tiền vượt giới hạn');
const net=paid-returned,unverified=cancelled&&!canc.length,due=unverified?0:Math.max(0,entitled-net),refundDue=unverified?0:Math.max(0,net-entitled);
const row={id:b.id,code:b.code||b.id,entitled,paid,returned,net,due,refundDue,unverified};out.rows.push(row);out.count++;out.entitled+=entitled;out.collected+=paid;out.refunded+=returned;out.net+=net;out.due+=due;out.refundDue+=refundDue;if(unverified)out.unverified++;
}if(out.net!==out.collected-out.refunded)throw Error('Đối chiếu dòng tiền sai');return out;
}
function adjustmentReview(entries){if(!Array.isArray(entries))throw Error('Sổ điều chỉnh không hợp lệ');const pending=entries.filter(x=>x.status==='pending').length;const approvedRefunds=entries.filter(x=>x.status==='approved'&&x.type==='guest_refund');return {pending,approvedRefunds:approvedRefunds.length,approvedRefundAmount:approvedRefunds.reduce((n,x)=>n+x.amount,0),warning:approvedRefunds.length?'Cần đối chiếu từng bút toán hoàn tiền với chứng từ hoàn đã ghi để tránh trừ hai lần.':''}}
return {calculate,adjustmentReview};});