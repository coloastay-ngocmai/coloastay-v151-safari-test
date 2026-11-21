/* V46 - backup verification for local browser demo only; not a server security boundary */
(function(g){'use strict';
const required=['houses','owners','bookings','costs'];
const canonical=x=>JSON.stringify(x,Object.keys(x).sort());
async function digest(s){const a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(a)].map(v=>v.toString(16).padStart(2,'0')).join('')}
function validate(d){if(!d||typeof d!=='object'||Array.isArray(d))throw Error('Dữ liệu không phải đối tượng');for(const k of required)if(!Array.isArray(d[k]))throw Error('Thiếu danh sách '+k);for(const k of ['houses','bookings']){const ids=d[k].map(x=>x&&x.id);if(ids.some(x=>typeof x!=='string'||!x)||new Set(ids).size!==ids.length)throw Error('Mã trùng hoặc thiếu trong '+k)}const houseIds=new Set(d.houses.map(x=>x.id));for(const b of d.bookings){if(!houseIds.has(b.house)||!b.start||!b.end||b.start>=b.end||!Number.isFinite(Number(b.total))||Number(b.total)<0)throw Error('Lịch đặt không hợp lệ')}return true}
async function pack(data){validate(data);const payload=JSON.stringify(data);return {format:'coloastay-backup-v46',version:46,createdAt:new Date().toISOString(),sha256:await digest(payload),payload}}
async function unpack(pkg){if(!pkg||pkg.format!=='coloastay-backup-v46'||pkg.version!==46||typeof pkg.payload!=='string')throw Error('Phiên bản sao lưu không hỗ trợ');if(await digest(pkg.payload)!==pkg.sha256)throw Error('Sai mã toàn vẹn');const data=JSON.parse(pkg.payload);validate(data);return data}
function atomicRestore(storage,key,data){validate(data);const previous=storage.getItem(key);const next=JSON.stringify(data);const staging=key+'_v46_staging';try{storage.setItem(staging,next);if(storage.getItem(staging)!==next)throw Error('Ghi tạm không thành công');storage.setItem(key,next);if(storage.getItem(key)!==next)throw Error('Xác nhận ghi không thành công');storage.removeItem(staging);return true}catch(e){try{if(previous===null)storage.removeItem(key);else storage.setItem(key,previous)}catch(_){}try{storage.removeItem(staging)}catch(_){}throw e}}
g.CoLoaBackup46={validate,pack,unpack,atomicRestore};
})(typeof globalThis==='object'?globalThis:this);
