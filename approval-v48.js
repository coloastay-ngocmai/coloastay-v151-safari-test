(function(root){'use strict';
const KEY='coloastay_approval_v48_demo';
const read=()=>{
 let raw=localStorage.getItem(KEY);
 if(localStorage.getItem('cls_v101_committed')!==null){
  if(!root.CLSLedgerAudit117||!root.CLSLedger115)throw Error('Thiếu bộ đọc bản lưu chung');
  const audit=root.CLSLedgerAudit117.inspect(localStorage);
  if(!audit.ready)throw Error('Sổ duyệt cũ khác bản xác nhận; dừng đọc và duyệt');
  const committed=root.CLSLedger115.readCommitted(localStorage);
  raw=committed[KEY];
 }
if(raw===null){if(localStorage.getItem(KEY+'_source')!==null)throw Error('Thiếu sổ duyệt nhưng còn dấu vết dữ liệu tài chính: dừng thao tác');return CLS44.initial()}let v;try{v=JSON.parse(raw);CLS44.valid(v)}catch(e){throw Error('Sổ duyệt tiền hỏng hoặc bị sửa: dừng thao tác, không tạo sổ mới ('+e.message+')')}return v};
const fingerprint=db=>JSON.stringify({buildings:db.buildings,contracts:db.contracts,bookings:db.bookings,costs:db.costs,receipts:db.receipts,refunds:db.refunds,cancellations:db.cancellations});
const signature=db=>{let h=2166136261;for(const c of fingerprint(db)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
const sourceOf=state=>state&&typeof state.sourceSignature==='string'?state.sourceSignature:(localStorage.getItem('cls_v101_committed')!==null?null:localStorage.getItem(KEY+'_source'));
const actor=r=>r==='dao'?'admin':r==='mai'?'sales':'other';
function apply(db,role,type,id,params){
 if(typeof window.verifyCommittedParity118==='function')window.verifyCommittedParity118();
 if(window.__clsRecoveryError)throw Error('Đang khóa ghi: '+window.__clsRecoveryError);
 let state=read(),a=actor(role);
 const audit=CLSAudit50.audit(db,state,sourceOf(state),signature(db));
 if(audit.blocked && state.periods.length)throw Error('Sổ tài chính hoặc chứng từ không khớp; tạm khóa thao tác: '+audit.issues.map(x=>x.code).join(', '));
 if(a==='other')throw Error('Vai trò này không có quyền');
 const source=sourceOf(state);
 if(type!=='create'&&source!==signature(db))throw Error('Dữ liệu tài chính đã thay đổi. Cần đối chiếu lại trước khi thao tác');
 if(type==='create'&&state.periods.some(p=>p.id===id))throw Error('Kỳ đã tồn tại');
 const next=CLS44.commit(state,a,type,id,params,state.revision);
 const before=localStorage.getItem(KEY);
 const newSource=type==='create'?signature(db):source;
 if(newSource!==null)next.sourceSignature=newSource;
 const payload=JSON.stringify(next);
 if(!window.CLSLedger115)throw Error('Thiếu cổng lưu chung');
 // The committed snapshot is authoritative. Never write the old detached source key.
 // Commit first, then mirror the approval ledger for old UI readers.
 const committedBefore=CLSLedger115.readCommitted(localStorage);
 try{
  CLSLedger115.transact(localStorage,{[KEY]:payload});
  const verified=CLSLedger115.readCommitted(localStorage);
  if(!verified||verified[KEY]!==payload)throw Error('Sổ duyệt chưa được xác nhận trong bản lưu chung');
  localStorage.setItem(KEY,payload);
  if(localStorage.getItem(KEY)!==payload)throw Error('Không đồng bộ được sổ đọc duyệt tiền');
  return next;
 }catch(e){
  // If commit succeeded but mirroring failed, do not roll back the committed pointer.
  // Lock writes and let the explicit mirror recovery restore the old reader.
  let current;
  try{current=CLSLedger115.readCommitted(localStorage)}catch(readError){window.__clsRecoveryError='Không đọc được bản xác nhận: '+readError.message;throw Error(window.__clsRecoveryError)}
  if(current && current[KEY]===payload){window.__clsRecoveryError='Bản duyệt đã xác nhận nhưng sổ đọc chưa đồng bộ; dùng Khôi phục sổ đọc';throw Error(window.__clsRecoveryError)}
  if((committedBefore&&current&&current[KEY]!==committedBefore[KEY])||(!committedBefore&&current)){
   window.__clsRecoveryError='Bản xác nhận thay đổi ngoài dự kiến';throw Error(window.__clsRecoveryError);
  }
  if(localStorage.getItem(KEY)!==before){
   try{if(before===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,before)}catch(_){}
   if(localStorage.getItem(KEY)!==before){window.__clsRecoveryError='Không hoàn nguyên được sổ duyệt';throw Error(window.__clsRecoveryError)}
  }
  throw e;
 }

}
function run(type,id){try{const params={};if(type==='create'){params.house=document.getElementById('a48house').value;params.month=document.getElementById('a48month').value;params.amount=Number(document.getElementById('a48amount').value);params.unverified=true;id=params.house+'-'+params.month;if(!params.house||!/^[0-9]{4}-[0-9]{2}$/.test(params.month))throw Error('Cần chọn nhà và tháng');}if(type==='pay'){params.ref=prompt('Mã chứng từ thanh toán (giả định):');if(params.ref===null)return}if(type==='adjust'){params.amount=Number(prompt('Khoản điều chỉnh có dấu (+/-), đơn vị đồng:'));params.reason=prompt('Lý do điều chỉnh:')||''}if(['verify','approve','pay'].includes(type)&&!confirm('Xác nhận thao tác '+type+' với dữ liệu GIẢ?'))return;apply(db,simulatedRole,type,id,params);render()}catch(e){alert('Không thực hiện: '+e.message)}}
function renderPanel(db,role,esc,money){const s=read(),sig=signature(db),source=sourceOf(s),changed=!!source&&source!==sig;const labels={draft:'Chờ xác minh',locked:'Đã khóa',requested:'Chờ chị Đào duyệt',approved:'Đã duyệt',paid:'Đã xác nhận thanh toán'};return `<h2>Duyệt tiền V48 – tích hợp dữ liệu trên máy</h2><div class="notice"><b>CHỈ THỬ NGHIỆM.</b> Kỳ được nhập số tiền thủ công và mặc định chưa xác minh. Chỉ có thể khóa sau khi chị Đào xác minh đối chiếu hợp đồng, công nợ, chi phí và chứng từ. Không chuyển khoản tự động. Không phải bảo mật máy chủ.</div>${changed?'<div class="notice" style="background:#fff0df">⚠️ Dữ liệu nguồn đã thay đổi. Tạm khóa mọi thao tác với kỳ hiện có. Phải kiểm tra lại trước khi tiếp tục.</div>':''}<div class="card"><h3>Lập kỳ đối soát giả</h3><label>Nhà</label><select id="a48house">${(db.buildings||[]).map(x=>`<option value="${esc(x.code)}">${esc(x.code)} – ${esc(x.name)}</option>`).join('')}</select><label>Tháng</label><input id="a48month" type="month" value="2026-10"><label>Tiền dự kiến trả chủ nhà (đồng) – nhập sau đối chiếu</label><input id="a48amount" inputmode="numeric" type="number" min="0" step="1" placeholder="0"><button class="primary" onclick="CLSApproval48.run('create','')">Lập kỳ chờ xác minh</button></div><div class="card"><h3>${s.periods.length} kỳ • ${s.events.length} sự kiện nhật ký</h3>${s.periods.map(p=>`<div class="item"><b>${esc(p.id)}</b> – ${esc(labels[p.status])}<p>${money(p.amount)} • ${p.unverified?'Chưa xác minh':'Đã xác minh giả lập'} • ${p.paymentRef?'Chứng từ '+esc(p.paymentRef):'Chưa thanh toán'}</p><div class="actions">${p.status==='draft'?`<button onclick="CLSApproval48.run('verify','${esc(p.id)}')">Đào xác minh</button><button onclick="CLSApproval48.run('lock','${esc(p.id)}')">Khóa sổ</button>`:''}${p.status==='locked'?`<button onclick="CLSApproval48.run('request','${esc(p.id)}')">Mai lập đề nghị</button>`:''}${p.status==='requested'?`<button onclick="CLSApproval48.run('approve','${esc(p.id)}')">Đào duyệt</button>`:''}${p.status==='approved'?`<button onclick="CLSApproval48.run('pay','${esc(p.id)}')">Đào xác nhận đã trả</button>`:''}${p.status!=='draft'?`<button onclick="CLSApproval48.run('adjust','${esc(p.id)}')">Ghi điều chỉnh chờ</button>`:''}</div>${p.adjustments.length?`<small>${p.adjustments.length} khoản điều chỉnh chờ xử lý kỳ sau</small>`:''}</div>`).join('')||'Chưa có kỳ đối soát.'}</div><div class="notice">Trạng thái thanh toán chỉ là xác nhận giả định, không kiểm chứng ngân hàng. Khi nguồn thay đổi, không tự động mở khóa hoặc sửa số tiền đã duyệt.</div>`}
root.CLSApproval48={render:renderPanel,run,apply,read,signature};
})(window);