const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const ctx={console,TextEncoder,TextDecoder,crypto:require('crypto').webcrypto};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const f of ['workflow-v44.js','adjustments-v58.js','accounting-v60.js','atomic-ledgers-v103.js','ledger-transaction-v115.js','mirror-restore-v125.js','independent-restore-v150.js','independent-export-v151.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),ctx,{filename:f});
const api=ctx.CLSIndependentRestore150,A=ctx.CLSAtomic101,G=ctx.CLSLedger115,keys=G.KEYS;
const good=JSON.parse(fs.readFileSync(path.join(__dirname,'DU_LIEU_GIA_V151_DA_SUA_SO.json')));
const bad=JSON.parse(fs.readFileSync(path.join(__dirname,'DU_LIEU_GIA_V150_4_DON.json')));
function checksum(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
function mutate(pkg,k,serialized){let p=JSON.parse(JSON.stringify(pkg));p.items[k]=serialized;let snap=JSON.parse(p.items[A.PREFIX+p.committedSequence]);snap.data[k]=serialized;snap.hash=checksum(JSON.stringify({sequence:snap.sequence,data:snap.data}));p.items[A.PREFIX+p.committedSequence]=JSON.stringify(snap);return p}
function store(seed={},fail){let m=new Map(Object.entries(seed)),count=0;return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{count++;if(fail&&fail(k,count))throw Error('SIMULATED_WRITE_FAILURE '+k);m.set(k,String(v))},removeItem:k=>m.delete(k),dump:()=>Object.fromEntries(m),count:()=>count}}
let n=0;function check(label,fn){fn();n++;console.log('PASS',n,label)}
check('tệp giả hợp lệ được chuẩn bị',()=>assert.equal(api.prepare(good).summary.bookings,4));
for(const [i,label] of [[1,'Sổ duyệt V48'],[2,'Sổ điều chỉnh V58'],[3,'Sổ kế toán V60']]){
 check('phát hiện lỗi '+label,()=>assert.throws(()=>api.prepare(mutate(good,keys[i],JSON.stringify({items:[],entries:[]}))),new RegExp(label)));
}
check('tệp giả V150 cũ bị từ chối',()=>assert.throws(()=>api.prepare(bad),/Sổ duyệt V48/));
check('chặn kho có dữ liệu, không sửa',()=>{let s=store({[keys[0]]:'existing',existing:'keep'});assert.throws(()=>api.restoreEmpty(s,good,true),/trống/);assert.deepEqual(s.dump(),{[keys[0]]:'existing',existing:'keep'})});
check('chặn thiếu xác nhận, không sửa',()=>{let s=store();assert.throws(()=>api.restoreEmpty(s,good,false),/xác nhận/);assert.deepEqual(s.dump(),{})});
let persisted;
check('phục hồi vào kho sạch',()=>{persisted=store();let out=api.restoreEmpty(persisted,good,true);assert.equal(out.bookings,4);assert.equal(out.receipts,2);assert.equal(out.sequence,1)});
check('5 sổ khớp snapshot sau khi tải lại',()=>{let reloaded=store(persisted.dump());let data=G.readCommitted(reloaded);for(const k of keys)assert.equal(data[k],good.items[k]);assert.equal(keys.length,5)});
check('đơn và công nợ sau tải lại',()=>{let main=JSON.parse(G.readCommitted(store(persisted.dump()))[keys[0]]);assert.equal(main.bookings.length,4);let b=main.bookings.find(x=>x.code==='DP-0004');assert.ok(b);let paid=main.receipts.filter(x=>x.booking===b.id).reduce((t,x)=>t+x.amount,0);assert.equal(b.total,800000);assert.equal(paid,300000);assert.equal(b.total-paid,500000)});
check('tính mã đơn tiếp theo từ 4 đơn',()=>{let main=JSON.parse(G.readCommitted(store(persisted.dump()))[keys[0]]);let max=Math.max(0,...main.bookings.map(x=>Number(/^DP-(\d+)$/.exec(x.code||'')?.[1]||0)),Number(main.bookingSequence)||0);assert.equal('DP-'+String(max+1).padStart(4,'0'),'DP-0005')});
check('lỗi ghi snapshot: không tạo HEAD',()=>{let s=store({},(k)=>k===A.PREFIX+'1');assert.throws(()=>api.restoreEmpty(s,good,true),/SIMULATED/);assert.equal(s.getItem(A.HEAD),null)});
check('lỗi ghi HEAD: không có bản xác nhận, giữ staging',()=>{let s=store({},k=>k===A.HEAD);assert.throws(()=>api.restoreEmpty(s,good,true),/SIMULATED/);assert.equal(s.getItem(A.HEAD),null);assert.ok(s.getItem(A.PREFIX+'1'));assert.equal(G.readCommitted(s),null)});
check('lỗi ghi mirror sau commit: HEAD giữ nguyên, báo lỗi',()=>{let s=store({},k=>k===keys[2]);assert.throws(()=>api.restoreEmpty(s,good,true));assert.ok(G.readCommitted(s));assert.notEqual(s.getItem(keys[2]),good.items[keys[2]])});
check('xuất JSON từ 5 sổ đã phục hồi và kiểm tra lại',()=>{let out=ctx.CLSIndependentExport151.pack(persisted);assert.equal(api.prepare(out).summary.bookings,4);assert.equal(out.items[keys[4]],good.items[keys[4]])});
check('xuất rồi phục hồi sang kho sạch thứ hai',()=>{let out=ctx.CLSIndependentExport151.pack(persisted),s=store();api.restoreEmpty(s,out,true);for(const k of keys)assert.equal(G.readCommitted(s)[k],G.readCommitted(persisted)[k])});
check('không xuất khi một sổ đọc sai khác',()=>{let s=store(persisted.dump());s.setItem(keys[1],'{}');assert.throws(()=>ctx.CLSIndependentExport151.pack(s),/chưa đồng bộ/)});
check('không thể phục hồi lần hai lên kho đã có HEAD',()=>{assert.throws(()=>api.restoreEmpty(persisted,good,true),/trống/)});
check('checksum sửa sai bị từ chối',()=>{let x=JSON.parse(JSON.stringify(good));x.items[A.PREFIX+'1']+='x';assert.throws(()=>api.prepare(x))});
console.log('RESULT '+n+'/'+n+' PASS — mock storage only, NOT Safari or production');
