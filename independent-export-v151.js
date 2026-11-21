/* V151 independent export of five validated committed ledgers; no storage mutation. */
(function(root){'use strict';
function pack(store){
 const A=root.CLSAtomic101,G=root.CLSLedger115,R=root.CLSIndependentRestore150;
 if(!A||!G||!R)throw Error('Thiếu thành phần sao lưu');
 const committed=A.read(store);
 if(!committed)throw Error('Chưa có bản xác nhận; không xuất');
 G.validateAll(committed.data);
 for(const k of G.KEYS)if(store.getItem(k)!==committed.data[k])throw Error('Sổ đọc chưa đồng bộ: '+k);
 const items={[A.HEAD]:String(committed.sequence),[A.PREFIX+committed.sequence]:store.getItem(A.PREFIX+committed.sequence)};
 for(const k of G.KEYS)items[k]=committed.data[k];
 const pkg={format:'coloastay-independent-readonly-1',committedSequence:String(committed.sequence),items};
 R.prepare(pkg);
 return pkg;
}
root.CLSIndependentExport151={pack};
})(typeof window!=='undefined'?window:globalThis);
