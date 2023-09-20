const express =  require('express');
const router =  express.Router();
const utilityService = require('../Services/UtilityService')

router.get("/accountDashboard", async (req, res) => {
  try {
    let dashboard = [];
    let qry, pramType, pramValues,result,dated;
    dated = utilityService.toQueryDateString( new Date( req.query.dated));
    
    //Cash in Hand
    qry =
      "With cte As (select AccNo, ISNULL(SUM(Debit), 0)-ISNULL(SUM(credit), 0)Bal from VVouchers With(NOLOCK) where Fyear= @Fyear AND AccNo In(select AutoAccNo  from Account_AutoEntry Where VchrTypeAbbreviation = @vchrType) Group by AccNo UNION ALL select AccountNo,ISNULL(SUM(OpDebit), 0) - ISNULL(SUM(Opcredit), 0)Bal from Account_OpeningBalance With(NOLOCK)  where Fyear= @Fyear AND AccountNo In(select AutoAccNo  from Account_AutoEntry  Where VchrTypeAbbreviation = @vchrType) Group by AccountNo ) Select Convert(float,Round(SUM(Bal),0))Bal from cte ";
    pramType = "@Fyear varchar(10) , @vchrType varchar(10)";
    pramValues = ["'2223','CPV'"];
    result = await utilityService.executeQuery(qry,pramType,pramValues);
    dashboard.push({
      title: "Cash In Hand",
      value: result[0].Bal,
      tag: "cashInHand",
       valuePerc:''
    });

//No of vouchers today
qry = "Select Convert(float,ISNULL(Count(*),0))postedToday from VoucherMaster Where Convert(Date,EntryDt)= @dated"
pramType="@dated Date";
pramValues = [`'${dated}'`]
result = await utilityService.executeQuery(qry,pramType,pramValues);
dashboard.push({
title: `Posted at Dated`,
value: result[0].postedToday,
tag: "postedToday",
 valuePerc:''
});

//verified today
qry = "Select Convert(float,ISNULL(Count(*),0))verifiedToday from VoucherMaster Where ISNULL(Checked,0)=1 AND Convert(Date,CheckByDateTime)= @dated"
pramType="@dated Date";
pramValues = [`'${dated}'`]
result = await utilityService.executeQuery(qry,pramType,pramValues);
dashboard.push({
title: `Verified at Dated` ,
value: result[0].verifiedToday,
tag: "verifiedToday",
 valuePerc:''
});

//Total un-verified
qry = "Select Convert(float,ISNULL(Count(*),0))totalUnVerified from VoucherMaster Where ISNULL(checked,0)=0";
result = await utilityService.executeQuery(qry,pramType,pramValues);
dashboard.push({
title: "Total Unverified Vouchers",
value: result[0].totalUnVerified,
tag: "totalUnVerified",
 valuePerc:''
});

// today Presented cheques 
qry = "select ISNULL(Count(*),0)todayPresentChqs from VoucherMaster where VoucherType =@vchrType and VDate= @dated";
pramType = "@vchrType varchar(10),@dated Date"
pramValues=[`'BPV','${dated}'`]
result = await utilityService.executeQuery(qry,pramType,pramValues);
dashboard.push({
title: "Chqs Presented at Dated",
value: result[0].todayPresentChqs,
tag: "todayPresentChqs",
 valuePerc:''
});

//Post Dated Cheques 
qry = "Select Convert(float,ISNULL(Count(*),0))postedChqs from VoucherMaster Where VoucherType=@vchrType AND Convert(Date,VDate)> @dated";
pramType = "@vchrType varchar(10),@dated Date"
pramValues=[`'BPV','${dated}'`]
result = await utilityService.executeQuery(qry,pramType,pramValues);
dashboard.push({
title: "Post Dated Cheques",
value: result[0].postedChqs,
tag: "postDatedChqs",
 valuePerc:''
});

// //total Un-Posted Bill
qry = "Select Convert(float,Count(ClearanceNo))unpostedBills from Stock_PO_Clearance_Master Where ISNULL(IsPosted,0)=0 " ;
result = await utilityService.executeQuery(qry,pramType,pramValues);
dashboard.push({
title: "Total Un-posted Bills",
value: result[0].unpostedBills,
tag: "unpostedBills",
 valuePerc:''
});


    res.send({msg:"success",data:dashboard})
  } catch (erro) {
    res.send({ msg: "error", data: [] });
  }
});


router.get("/accountDashboard/accountDashboardDetail",async(req,res)=> {
try {
  let qry, pramType, pramValues,result,dated,tag;
  tag= req.query.tag;
  dated = utilityService.toQueryDateString( new Date(req.query.dated));
  
  if (tag === "postedToday") {
    qry =
      "select DetailIndex as ID,VchrNo,VDate,AccNo,AccTitle,Debit,Credit,Checked as Verified from VVouchersNew where Convert(Date,EntryDt)=@dated Order by VDate ,VchrNo";
    pramType = "@dated Date";
    pramValues = [`'${dated}'`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  } else if (tag === "verifiedToday") {
    qry =
      "Select DetailIndex as ID,VchrNo,VDate,AccNo,AccTitle,Debit,Credit,Checked as Verified from VVouchersNew Where ISNULL(Checked,0)=1 AND Convert(Date,CheckByDateTime)= @dated";
    pramType = "@dated Date";
    pramValues = [`'${dated}'`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  } else if (tag === "totalUnVerified") {
    qry =
      "Select DetailIndex as ID,VchrNo,VDate,AccNo,AccTitle,Debit,Credit,Checked as Verified from VVouchersNew Where ISNULL(checked,0)=0 ";
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  } else if (tag === "todayPresentChqs") {
    qry =
      "Select DetailIndex as ID,VchrNo,VDate,AccNo,AccTitle,Debit,Credit,ChqNo from VVouchersNew where VoucherType =@vchrType and VDate= @dated AND ISNULL(Debit,0)>0";
    pramType = "@vchrType varchar(10),@dated Date";
    pramValues = [`'BPV','${dated}'`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  } else if (tag === "postDatedChqs") {
    qry =
      "Select DetailIndex as ID,VchrNo,VDate,AccNo,AccTitle,Debit,Credit,ChqNo from VVouchersNew Where VoucherType=@vchrType AND Convert(Date,VDate)> @dated AND DetailIndex IS NOT NULL AND ISNULL(Debit,0)>0";
    pramType = "@vchrType varchar(10),@dated Date";
    pramValues = [`'BPV','${dated}'`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  }else if (tag==='unpostedBills') {
    qry = "Select m.ClearanceNo as ID,m.ClearanceNo,Dated,m.VendorCode,v.VendorName as Vendor,PONo,BillNo ,BillDate,d.Amount from Stock_PO_Clearance_Master m Left join (Select ClearanceNo,Round(ISNULL(SUM(Total),0),0)Amount from Stock_PO_Clearance_Detail Group by ClearanceNo  )d on m.ClearanceNo = d.ClearanceNo Left join Stock_Vendors v on m.VendorCode = v.VendorCode Where ISNULL(IsPosted,0)=0" ;
    result = await utilityService.executeQuery(qry,pramType,pramValues);
  }
    
  res.send({msg:"success",data:result})
 
}catch(error) {
res.send({msg:"error",data:[]})
}
})

module.exports =router;