/* V54: local-only fail-closed finance guard. Server enforcement still required. */
(function(g){'use strict';
function guard(before,after,approval,signature){
 if(!approval || !Array.isArray(approval.periods))return {ok:false,reason:'Không đọc được sổ duyệt tiền'};
 const protectedPeriods=approval.periods.filter(p=>['locked','requested','approved','paid'].includes(p.status));
 if(!protectedPeriods.length)return {ok:true};
 if(signature(before)!==signature(after))return {ok:false,reason:'Đã có kỳ khóa sổ/duyệt tiền. Không được sửa dữ liệu tài chính nguồn; cần lập điều chỉnh theo quy trình.'};
 return {ok:true};
}
function verifyStored(storage,key,next,readApproval,signature){
 const raw=storage.getItem(key);
 if(raw===null)return {ok:false,reason:'Không tìm thấy bản dữ liệu gốc để đối chiếu'};
 let before,approval;
 try{before=JSON.parse(raw);approval=readApproval()}catch(e){return {ok:false,reason:'Dữ liệu gốc hoặc sổ duyệt không đọc được'}}
 return guard(before,next,approval,signature);
}
g.CLSGuard54={guard,verifyStored};
})(typeof window!=='undefined'?window:globalThis);
