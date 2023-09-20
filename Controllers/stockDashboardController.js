const express =  require('express');
const utilityService = require('../Services/UtilityService')
const router = express.Router();

router.get("/stockDashboard", async (req, res) => {
  try {
    let dashboard = [];
    let qry, paramType, paramValues, result;
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;
    let store = req.query.store;

    console.log("FromDate",fromDate,"toDate",toDate);
    console.log(new Date(fromDate))
 
    // fromDate = utilityService.toQueryDateString( new Date(fromDate));
    // toDate =  utilityService.toQueryDateString( new Date(toDate));

    console.log("FromDate",fromDate,"toDate",toDate);

    storeQry = store === "All" ? "" : " AND store=@store";
    storeParamsType = store === "All" ? "" : " , @store varchar(50)";
    storeValue = store === "All" ? "" : `,'${store}'`;

    //Total Purchase
     qry = "select Round(ISNULL(SUM(Amount),0),0)totalPurchase from Stock_PO_Detail Where PONo IN (Select PONo from Stock_PO_Master " +
      " Where Order_Date between @fromDate and @toDate AND Internal_External<>@internalExternal AND ISNULL(Cancel,0)=0 AND ISNULL(IsApproved,0)=1)" + storeQry;
    paramType =  "@fromDate Date,@toDate Date ,@internalExternal varchar(50) " + storeParamsType;
    paramValues = [`'${fromDate}','${toDate}','Services' ${storeValue}`];
    result = await utilityService.executeQuery(qry, paramType, paramValues);
    dashboard.push({
      title: "Total Purchase",
      value: result[0].totalPurchase,
      tag: "totalPurchase",
      valuePerc: ""
    });

    //Total Receiving
    qry =
      "Select Round(ISNULL(SUM(NetAmount),0),0)totalReceiving from Stock_Receive_Detail d left join Stock_Receive_Master m on d.RecvNo = m.RecvNo  where m.Dated between @fromDate and @toDate and ReceiveType <>@receiveType " +  `${store === "All" ? "" : " AND d.store=@store"}`;

    paramType =
      "@fromDate Date,@toDate Date ,@receiveType varchar(50) " +
      storeParamsType;
    paramValues = [`'${fromDate}','${toDate}','InternalTransfer' ${storeValue}`];
    result = await utilityService.executeQuery(qry, paramType, paramValues);
    dashboard.push({
      title: "Total Receiving",
      value: result[0].totalReceiving,
      tag: "totalReceiving",
      valuePerc: ""
    });

    //Total un-Approved Demands
    qry =
      "select ISNULL(Count(*),0)unApprovedDemands from Stock_DemandMaster where ISNULL(IsApproved,0)=0 AND Dated between @fromDate AND @toDate " +
      storeQry;

    paramType = "@fromDate Date,@toDate Date  " + storeParamsType;
    paramValues = [`'${fromDate}','${toDate}' ${storeValue}`];
    result = await utilityService.executeQuery(qry, paramType, paramValues);
    dashboard.push({
      title: "Un-Approved Demands",
      value: result[0].unApprovedDemands,
      tag: "unApprovedDemands",
      valuePerc: ""
    });

    //Pending Demands
    qry = "Select ISNULL(Count(*),0)pendingDemands from DB_VPendingDemands Where Dated between @fromDate AND @toDate" + storeQry;
    paramType = "@fromDate Date,@toDate Date  " + storeParamsType;
    paramValues = [`'${fromDate}','${toDate}' ${storeValue}`];
    result = await utilityService.executeQuery(qry, paramType, paramValues);
    dashboard.push({
      title: "Pending Demands",
      value: result[0].pendingDemands,
      tag: "pendingDemands",
      valuePerc: ""
    });

    //Un Approved POs
    qry = "select Convert(float,ISNULL(Count(PONo),0))unApprovedPOs from Stock_PO_Master Where Order_Date between @fromDate AND @toDate AND Internal_External<>@Services AND  Internal_External <>  @Process AND ISNULL(Cancel,0)=0  AND ISNULL(IsApproved,0)=0 AND Store IS NOT NULL " + storeQry;
    paramType = "@fromDate Date,@toDate Date , @Services varchar(25),@Process varchar(25)" + storeParamsType;
    paramValues = [`'${fromDate}','${toDate}' , 'Services','Process' ${storeValue}`];
    result = await utilityService.executeQuery(qry, paramType, paramValues);
    dashboard.push({
      title: "Un Approved POs",
      value: result[0].unApprovedPOs,
      tag: "unApprovedPOs",
      valuePerc: ""
    });

     //Un Received Pos
     qry = " select Count(distinct pono)unReceivedPos from ( Select m.Store,m.Order_Date as Dated, m.PONo,d.DemandNo,d.OrderNo, o.CustomerProdNme as Customer,d.Item_Name as Material, d.Qty,r.PONo as RecvPONo  from Stock_PO_Detail d left join Stock_PO_Master m on d.PONo=m.PONo left join WG_VOrderMaster o on d.OrderNo = o.OrderID left join Stock_Receive_Detail r on d.PONo = r.PONo AND d.DemandNo =r.DemandNo and d.OrderNo =r.OrderNo and d.Item_Code =r.Item_Code  Where m.order_Date between @fromDate AND @toDate AND m.Internal_External <>@Services AND m.Internal_External <> @Process AND ISNULL(m.IsApproved,0)=1 and ISNULL(m.Cancel,0)=0 and r.PONo is null "  + `${store === "All" ? "" : " AND m.store=@store"}` + ")x"  ;

     paramType = "@fromDate Date,@toDate Date , @Services varchar(25) ,@Process varchar(10) " + storeParamsType;
     paramValues = [`'${fromDate}','${toDate}' , 'Services','Process' ${storeValue}`];
     result = await utilityService.executeQuery(qry, paramType, paramValues);
     dashboard.push({
       title: "Un Received POs",
       value: result[0].unReceivedPos,
       tag: "unReceivedPos",
       valuePerc: ""
     });

     //Gate-Pass Without Inspection
     qry = "with cte as (select distinct Gate_PassNo,Store from Gate_Stock_Receiving_Detail Where LEN(ISNULL(InspNo ,''''))=0 ) Select ISNULL(Count(*),0)gatePassWithoutInspection from cte left join Gate_Stock_Receiving_Master m on cte.Gate_PassNo = m.Gate_PassNo Where Dated between @fromDate AND @toDate " +  `${store === "All" ? "" : " AND cte.store=@store"}`;;
     paramType = "@fromDate Date,@toDate Date " + storeParamsType;
     paramValues = [`'${fromDate}','${toDate}'  ${storeValue}`];
     result = await utilityService.executeQuery(qry, paramType, paramValues);
     dashboard.push({
       title: "IGP Without Inspection",
       value: result[0].gatePassWithoutInspection,
       tag: "gatePassWithoutInspection",
       valuePerc: ""
     });

     //Un Received Inspection
     qry = "With cte as (select Distinct Store,Dated,Gate_PassNo,InspNo ,VendorCode ,VendorName from Gate_Stock_VReceiving Where LEN(ISNULL(InspNo,''''))>0 AND LEN(ISNULL(RTrim(Ltrim(ReceiveNo)),''''))=0 ) Select Convert(float,ISNULL(Count(*),0))unReceivedInspection from cte Where Dated between @fromDate AND @toDate " + storeQry;
     paramType = "@fromDate Date,@toDate Date " + storeParamsType;
     paramValues = [`'${fromDate}','${toDate}'  ${storeValue}`];
     result = await utilityService.executeQuery(qry, paramType, paramValues);
     dashboard.push({
       title: "Un-Received Inspection",
       value: result[0].unReceivedInspection,
       tag: "unReceivedInspection",
       valuePerc: ""
     });

     //Un Close Receiving
     qry = "Select Convert(float,Count(RecvNo))unCloseReceiving from Stock_Receive_Master Where Dated between @fromDate AND @toDate AND  RecvNo In (select RecvNo  from Stock_Receive_Detail Where LEN(ISNULL(CloseNo,''''))=0) AND ReceiveType<>@receiveType " + storeQry;
     paramType = "@fromDate Date,@toDate Date ,@receiveType varchar(25) " + storeParamsType;
     paramValues = [`'${fromDate}','${toDate}','InternalTransfer'  ${storeValue}`];
     result = await utilityService.executeQuery(qry, paramType, paramValues);
     dashboard.push({
       title: "Un-Closed Receiving",
       value: result[0].unCloseReceiving,
       tag: "unCloseReceiving",
       valuePerc: ""
     });

      //Un Posted Bills
      qry = "Select Convert(float,Count(ClearanceNo))unpostedBills from Stock_PO_Clearance_Master Where ISNULL(IsPosted,0)=0 AND Dated between @fromDate AND @toDate" + storeQry 
      paramType = "@fromDate Date,@toDate Date" + storeParamsType;
      paramValues = [`'${fromDate}','${toDate}' ${storeValue}`];
      result = await utilityService.executeQuery(qry, paramType, paramValues);
      dashboard.push({
        title: "Un-Posted Bills",
        value: result[0].unpostedBills,
        tag: "unpostedBills",
        valuePerc: ""
      });

    res.send({ msg: "success", data: dashboard });
  } catch (error) {
    res.send({ msg: error, data: [] });
  }
});


router.get ("/StockDashboard/StockDashboardDetail",async (req,res)=> {
try {
var qry,paramType,paramValues,storeQry,result
const store = req.query.store;
const fromDate =  req.query.fromDate;
const toDate =  req.query.toDate;
const tag = req.query.tag;

storeQry = store === "All" ? "" : " AND store=@store";
storeParamsType = store === "All" ? "" : " , @store varchar(50)";
storeValue = store === "All" ? "" : `,'${store}'`;
if (tag === "totalPurchase") {
  qry =
    "Select x.VendorCode as ID,x.Store,x.VendorCode as Code,VendorName as Vendor,Internal_External as Category ,Amount from ( Select store,VendorCode,Internal_External,Round(ISNULL(SUM(Amount),0),0)Amount from ( Select d.Store,VendorCode,Internal_External,ISNULL(d.NetAmount,0)Amount from Stock_PO_Master m left join Stock_PO_Detail d on m.PONo = d.PONo Where Internal_External <>@Services AND Order_Date between @fromDate AND @toDate AND ISNULL(isApproved,0)=1 AND ISNULL(Cancel,0)=0 )PO group by Store,VendorCode,Internal_External )x left join Stock_Vendors v on x.VendorCode = v.VendorCode " +
    `${store === "All" ? "" : " AND x.store=@store"}`;
  paramType =
    "@Services varchar(15), @fromDate Date,@toDate Date " + storeParamsType;
  paramValues = [`'Services','${fromDate}','${toDate}' ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({
    msg: "success",
    data: result,
    columns: getColumns("totlaPurchase"),
  });
} else if (tag === "totalReceiving") {
  qry =
    "Select x.VendorCode as ID,x.Store,x.VendorCode as Code,VendorName as Vendor,ReceiveType as Category ,Amount from ( Select store,VendorCode,ReceiveType,Round(ISNULL(SUM(Amount),0),0)Amount from ( Select d.Store,VendorCode,ReceiveType,ISNULL(d.NetAmount,0)Amount from Stock_Receive_Master  m left join Stock_Receive_Detail d on m.RecvNo = d.RecvNo Where ReceiveType <>@receiveType AND Dated between @fromDate AND @toDate)recv group by Store,VendorCode,ReceiveType )x left join Stock_Vendors v on x.VendorCode = v.VendorCode " +
    `${store === "All" ? "" : " AND x.store=@store"}`;
  paramType =
    "@receiveType varchar(15), @fromDate Date,@toDate Date " + storeParamsType;
  paramValues = [`'InternalTransfer','${fromDate}','${toDate}' ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({
    msg: "success",
    data: result,
    columns: getColumns("totalReceiving"),
  });
} 
else if (tag === "unApprovedDemands") {
  qry =
    "select d.DetailIndex as ID,m.Store,Dated,m.DemandNo,OrderNo,o.CustomerProdNme as Customer,Item_Name as Material,Qty from Stock_DemandMaster m left join Stock_DemandDetail d on m.DemandNo = d.DemandNo left join WG_VOrderMaster o on d.OrderNo = o.OrderID where ISNULL(IsApproved,0)=0 AND Dated between @fromDate AND @toDate and ISNULL(d.IsCleared,0)=0 AND ISNULL(d.DemandAlreadyMadeAgainstStock,0)=0 " +
    `${store === "All" ? "" : " AND m.store=@store"}`;
  paramType = `@fromDate Date ,@toDate Date  ${storeParamsType}`;
  paramValues = [`'${fromDate}','${toDate}' ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({ msg: "success", data: result });
}
else if (tag === "pendingDemands") {
  qry =
    "select ROW_NUMBER() over (order by GetDate())ID,Store,Dated,DemandNo ,OrderNo,Customer,item_name as Material,Qty  from DB_VPendingDemands Where Dated between @fromDate AND @toDate " + storeQry;
   paramType = `@fromDate Date ,@toDate Date  ${storeParamsType}`;
  paramValues = [`'${fromDate}','${toDate}' ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({ msg: "success", data: result });
}
else if (tag === "unApprovedPOs") {
  qry =
    "select d.Detailindex as ID,m.Store,m.Order_Date as Dated,m.PONo,DemandNo,d.OrderNo, o.CustomerProdNme as Customer,d.Item_Name as Material,d.Qty  from Stock_PO_Master m left join Stock_PO_Detail d on m.PONo =d.PONo left join WG_VOrderMaster o on d.OrderNo = o.OrderID  Where m.Order_Date between @fromDate AND @toDate AND Internal_External<>@Services AND Internal_External <>@Process AND ISNULL(Cancel,0)=0 and ISNULL(isApproved,0)=0 " + `${store === "All" ? "" : " AND m.store=@store"}`;
   paramType = `@fromDate Date ,@toDate Date, @Services varchar(25),@Process varchar(25)  ${storeParamsType}`;
  paramValues = [`'${fromDate}','${toDate}','Services','Process' ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({ msg: "success", data: result });
}

else if (tag === "unReceivedPos") {
  qry = " Select d.DetailIndex as ID,m.Store,m.Order_Date as Dated, m.PONo,d.DemandNo,d.OrderNo, o.CustomerProdNme as Customer,d.Item_Name as Material, d.Qty from Stock_PO_Detail d left join Stock_PO_Master m on d.PONo=m.PONo left join WG_VOrderMaster o on d.OrderNo = o.OrderID left join Stock_Receive_Detail r on d.PONo = r.PONo AND d.DemandNo =r.DemandNo and d.OrderNo =r.OrderNo and d.Item_Code =r.Item_Code  Where m.order_Date between @fromDate AND @toDate AND m.Internal_External <>@Services AND m.Internal_External <> @Process AND ISNULL(m.IsApproved,0)=1 and ISNULL(m.Cancel,0)=0 and r.PONo is null " +  `${store === "All" ? "" : " AND d.store=@store"}`;

  paramType = "@fromDate Date,@toDate Date , @Services varchar(25) ,@Process varchar(10) " + storeParamsType;
  paramValues = [`'${fromDate}','${toDate}' , 'Services','Process' ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({ msg: "success", data: result });
}

else if (tag === "gatePassWithoutInspection") {
  qry = " Select d.DetailIndex as ID,d.Store,Dated,d.Gate_PassNo,d.PONo,d.OrderNo ,Item_Name as Material,Qty from Gate_Stock_Receiving_Detail d left join Gate_Stock_Receiving_Master m on d.Gate_PassNo =m.Gate_PassNo Where LEN(ISNULL(d.InspNo,''''))=0 and m.Dated between @fromDate and @toDate " +  `${store === "All" ? "" : " AND d.store=@store"}`;
  paramType = "@fromDate Date,@toDate Date " + storeParamsType;
  paramValues = [`'${fromDate}','${toDate}'  ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({ msg: "success", data: result });
}

else if (tag === "unReceivedInspection") {
  qry = " Select d.DetailIndex as ID,d.Store,Dated,d.Gate_PassNo,d.OrderNo,o.CustomerProdNme as Customer,Item_Name as Material,Qty  from Gate_Stock_Receiving_Master m left join Gate_Stock_Receiving_Detail d on m.Gate_PassNo =d.Gate_PassNo left join WG_VOrderMaster o on d.OrderNo = o.OrderID   where Dated between @fromDate and @toDate and LEN(ISNULL(InspNo,''''))>0 and LEN(RTRIM(LTRIM(ISNULL(d.ReceiveNo,''''))))>0   " +  `${store === "All" ? "" : " AND d.store=@store"}`;
  paramType = "@fromDate Date,@toDate Date " + storeParamsType;
  paramValues = [`'${fromDate}','${toDate}'  ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({ msg: "success", data: result });
}
else if (tag === "unCloseReceiving") {
  qry = " Select Row_Number() over (order by GetDate())ID,d.Store,  Dated, d.RecvNo,d.OrderNo,VendorName as Vendor,Item_Name as Material,Qty from Stock_Receive_Master m Left join Stock_Receive_Detail d on m.RecvNo = d.recvNo   left join Stock_Vendors v on m.VendorCode = v.VendorCode  Where  Dated between @fromDate AND @toDate AND m.ReceiveType <> @internalTransfer and LEN(ISNULL(d.CloseNo,''''))=0 " +  `${store === "All" ? "" : " AND d.store=@store"}`;
  paramType = "@fromDate Date,@toDate Date ,@internalTransfer varchar(25) " + storeParamsType;
  paramValues = [`'${fromDate}','${toDate}','InternalTransfer'  ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({ msg: "success", data: result });
}
else if (tag === "unpostedBills") {
  qry = " Select d.DetailIndex as ID,d.Store,Dated,d.ClearanceNo,ClearanceType,VendorName as Vendor ,d.PONo,Qty,Rate,ROUND(ISNULL(Amount,0),0)Amount from Stock_PO_Clearance_Detail d left join Stock_PO_Clearance_Master m on d.ClearanceNo = m.ClearanceNo Left join Stock_Vendors v on m.VendorCode = v.VendorCode Where Dated between @fromDate AND @toDate and ISNULL(isPosted,0)=0" +  `${store === "All" ? "" : " AND d.store=@store"}`;
  paramType = "@fromDate Date,@toDate Date " + storeParamsType;
  paramValues = [`'${fromDate}','${toDate}' ${storeValue}`];
  result = await utilityService.executeQuery(qry, paramType, paramValues);
  res.send({ msg: "success", data: result });
}


} catch (error) {
  res.send({msg:error,data:[]})
}
})

module.exports = router;


