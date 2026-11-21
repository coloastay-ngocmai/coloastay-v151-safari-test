const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const dir=__dirname,ctx={console,TextEncoder,TextDecoder,crypto:require('crypto').webcrypto};ctx.window=ctx;ctx.globalThis=ctx;ctx.localStorage={getItem:()=>null};vm.createContext(ctx);
for(const f of ['workflow-v44.js','adjustments-v58.js','accounting-v60.js','atomic-ledgers-v103.js','ledger-transaction-v115.js','mirror-restore-v125.js','independent-restore-v150.js'])vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),ctx,{filename:f});
const base=JSON.parse(fs.readFileSync(path.join(dir,'DU_LIEU_GIA_V150_4_DON.json')));
const KEYS=ctx.CLSAtomic101.KEYS;
function checksum(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
const corrected=JSON.parse(JSON.stringify(base));
corrected.items[KEYS[1]]=JSON.stringify({schema:44,revision:0,periods:[],events:[],receipts:[]});
corrected.items[KEYS[2]]=JSON.stringify({version:1,revision:0,items:[]});
corrected.items[KEYS[3]]=JSON.stringify({schema:60,revision:0,entries:[]});
const snap=JSON.parse(corrected.items[ctx.CLSAtomic101.PREFIX+corrected.committedSequence]);for(const k of KEYS)snap.data[k]=corrected.items[k];snap.hash=checksum(JSON.stringify({sequence:snap.sequence,data:snap.data}));corrected.items[ctx.CLSAtomic101.PREFIX+corrected.committedSequence]=JSON.stringify(snap);
let passed=0;function test(name,fn){fn();passed++;console.log('PASS',name)}
function store(initial={}){const m=new Map(Object.entries(initial));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),dump:()=>Object.fromEntries(m)}}
test('original snapshot checksum valid',()=>ctx.CLSAtomic101.verify(base.items[ctx.CLSAtomic101.PREFIX+'1']));
test('original approval ledger rejected by actual V44 validator',()=>assert.throws(()=>ctx.CLS44.valid(JSON.parse(base.items[KEYS[1]]))));
test('original adjustments ledger rejected by actual V58 validator',()=>assert.throws(()=>ctx.CLSAdjust58.valid(JSON.parse(base.items[KEYS[2]]))));
test('original accounting ledger rejected by actual V60 validator',()=>assert.throws(()=>ctx.CLSAccounting60.valid(JSON.parse(base.items[KEYS[3]]))));
test('corrected approval accepted',()=>ctx.CLS44.valid(JSON.parse(corrected.items[KEYS[1]])));
test('corrected adjustments accepted',()=>ctx.CLSAdjust58.valid(JSON.parse(corrected.items[KEYS[2]])));
test('corrected accounting accepted',()=>ctx.CLSAccounting60.valid(JSON.parse(corrected.items[KEYS[3]])));
test('corrected snapshot checksum verified',()=>ctx.CLSAtomic101.verify(corrected.items[ctx.CLSAtomic101.PREFIX+'1']));
test('corrected independent package prepare',()=>assert.equal(ctx.CLSIndependentRestore150.prepare(corrected).summary.bookings,4));
test('original package now rejected for weak ledger schemas',()=>assert.throws(()=>ctx.CLSIndependentRestore150.prepare(base),/Sổ duyệt V48/));
test('nonempty store is rejected without mutations',()=>{const s=store({'unrelated':'keep',[KEYS[0]]:'existing'});const before=JSON.stringify(s.dump());assert.throws(()=>ctx.CLSIndependentRestore150.restoreEmpty(s,corrected,true),/trống/);assert.equal(JSON.stringify(s.dump()),before)});
test('unapproved restore rejected without mutations',()=>{const s=store();assert.throws(()=>ctx.CLSIndependentRestore150.restoreEmpty(s,corrected,false),/xác nhận/);assert.deepEqual(s.dump(),{})});
test('tampered corrected snapshot rejected',()=>{const x=JSON.parse(JSON.stringify(corrected));x.items[KEYS[1]]+=' ';assert.throws(()=>ctx.CLSIndependentRestore150.prepare(x))});
fs.writeFileSync(path.join(dir,'DU_LIEU_GIA_V151_DA_SUA_SO.json'),JSON.stringify(corrected,null,2));console.log(`RESULT ${passed}/${passed} PASS; no browser data touched`);
