(function(g){'use strict';
const approvalKey='coloastay_approval_v48_demo',sourceKey=approvalKey+'_source';
function audit(db,approval,source,signature){const issues=[],rows=[];const add=(code,detail)=>issues.push({code,detail});
if(!db||!Array.isArray(db.bookings)||!Array.isArray(db.receipts)||!Array.isArray(db.refunds))add('LEDGER_SCHEMA','Thiếu sổ đặt phòng, thu hoặc hoàn');
if(!approval||!Array.isArray(approval.periods)||!Array.isArray(approval.receipts)){add('APPROVAL_SCHEMA','Thiếu nhật ký duyệt tiền');return {issues,rows,blocked:true}}
const periods=approval.periods, receipts=approval.receipts;
if(periods.length&&source!==signature)add('SOURCE_CHANGED','Nguồn tài chính đã thay đổi sau khi lập kỳ');
const ids=new Set(), refs=new Set(), receiptRefs=new Set();
for(const r of receipts){
if(!r||typeof r!=='object'){add('BAD_RECEIPT','Chứng từ không hợp lệ');continue}
if(typeof r.ref!=='string'||!r.ref.trim())add('EMPTY_PAYMENT_REF',String(r.period||''));
else if(receiptRefs.has(r.ref))add('DUP_PAYMENT_REF_GLOBAL',r.ref);
else receiptRefs.add(r.ref);
if(!Number.isSafeInteger(Number(r.amount))||Number(r.amount)<=0)add('INVALID_PAYMENT_AMOUNT',String(r.period||''));
}

for(const p of periods){
if(!p||typeof p!=='object'){add('BAD_PERIOD','Kỳ không hợp lệ');continue}
if(!Number.isSafeInteger(Number(p.amount))||Number(p.amount)<0)add('INVALID_PERIOD_AMOUNT',String(p.id||''));
if(ids.has(p.id))add('DUP_PERIOD',p.id);ids.add(p.id);const matching=receipts.filter(r=>r.period===p.id);
if(p.status==='paid'){
if(!p.paymentRef||matching.length!==1||matching[0].ref!==p.paymentRef||Number(matching[0].amount)!==Number(p.amount))add('PAID_MISMATCH',p.id);
if(refs.has(p.paymentRef))add('DUP_PAYMENT_REF',p.paymentRef);refs.add(p.paymentRef);
}else if(matching.length)add('UNPAID_RECEIPT',p.id);
rows.push({id:p.id,status:p.status,amount:Number(p.amount)||0,receiptCount:matching.length});}
for(const r of receipts)if(r&&typeof r==='object'&&!ids.has(r.period))add('ORPHAN_RECEIPT',r.period);
return {issues,rows,blocked:issues.length>0,paidTotal:rows.filter(r=>r.status==='paid').reduce((s,r)=>s+r.amount,0)};}
function fromStorage(storage,key,signature){let db,approval;try{db=JSON.parse(storage.getItem(key));approval=JSON.parse(storage.getItem(approvalKey))}catch(e){return {issues:[{code:'BAD_JSON',detail:e.message}],rows:[],blocked:true}}return audit(db,approval,approval&&typeof approval.sourceSignature==='string'?approval.sourceSignature:storage.getItem(sourceKey),signature(db))}
g.CLSAudit50={audit,fromStorage};
})(typeof globalThis==='object'?globalThis:this);