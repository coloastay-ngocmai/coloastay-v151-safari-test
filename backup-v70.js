/* V70: browser-local crash recovery for five financial keys; not a server transaction. */
(function(g){'use strict';
const J='coloastay_v70_restore_journal', AK='coloastay_accounting_v60_demo', AD='coloastay_adjustments_v58_demo';
function keys(dbKey){return [dbKey,CoLoaCombined49.approvalKey,CoLoaCombined49.sourceKey,AD,AK]}
function put(s,k,v){if(v===null)s.removeItem(k);else s.setItem(k,v);if(s.getItem(k)!==v)throw Error('Không xác nhận được ghi: '+k)}
function recover(s){if(s.getItem('cls_v101_committed')!==null)throw Error('Đã có bản lưu chung: cấm khôi phục kiểu cũ trực tiếp; dùng khôi phục có kiểm tra V126');const raw=s.getItem(J);if(raw===null)return false;let j;try{j=JSON.parse(raw);if(j.version!==70||!Array.isArray(j.keys)||!Array.isArray(j.before)||j.keys.length!==5||j.before.length!==5||!j.keys[0]||typeof j.keys[0]!=='string'||new Set(j.keys).size!==5||j.keys[1]!==CoLoaCombined49.approvalKey||j.keys[2]!==CoLoaCombined49.sourceKey||j.keys[3]!==AD||j.keys[4]!==AK)throw Error('Sai cấu trúc')}catch(e){throw Error('Nhật ký V70 hỏng, DỪNG GHI: '+e.message)}for(let i=0;i<5;i++)put(s,j.keys[i],j.before[i]);s.removeItem(J);if(s.getItem(J)!==null)throw Error('Không xóa được nhật ký phục hồi');return true}
function restore(s,dbKey,x){if(s.getItem('cls_v101_committed')!==null)throw Error('Đã có bản lưu chung: cấm khôi phục kiểu cũ trực tiếp; dùng khôi phục có kiểm tra V126');const pending=s.getItem(J);if(pending!==null){let journal;try{journal=JSON.parse(pending)}catch(e){throw Error('Nhật ký khôi phục không đọc được; dừng ghi')}if(journal.keys?.[0]!==dbKey)throw Error('Nhật ký thuộc kho dữ liệu khác; dừng ghi');recover(s)}const k=keys(dbKey), before=k.map(v=>s.getItem(v));
// Preflight all source validation and anti-rollback checks in V69 before touching live storage.
const shadow=new Map(k.map((v,i)=>[v,before[i]]));const staged={getItem:v=>shadow.has(v)?shadow.get(v):null,setItem:(v,val)=>shadow.set(v,String(val)),removeItem:v=>shadow.delete(v)};
CLSBackup69.restore(staged,dbKey,x);
const next=k.map(v=>staged.getItem(v));s.setItem(J,JSON.stringify({version:70,keys:k,before}));if(s.getItem(J)===null)throw Error('Không tạo được nhật ký phục hồi');
try{for(let i=0;i<5;i++)put(s,k[i],next[i]);s.removeItem(J);if(s.getItem(J)!==null)throw Error('Không kết thúc được nhật ký');return true}catch(e){try{recover(s)}catch(re){throw Error('DỪNG SỬ DỤNG: ghi lỗi và phục hồi không thành công: '+re.message)}throw Error('Khôi phục thất bại; dữ liệu cũ đã được hoàn nguyên: '+e.message)}
}
g.CLSBackup70={recover,restore,journalKey:J};
})(typeof window!=='undefined'?window:globalThis);
