const express = require('express');
const utilityService =  require('../Services/UtilityService');
const router =  express.Router();

router.get("/chart", async (req, res) => {
  try {
    let qry, paramType, paramValues;

    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    const store = req.query.store;
    const tag = req.query.tag;

    const storeQry = store === "All" ? "" : " AND store=@store";
    const storeParamType = store === "All" ? "" : " ,@store varchar(50)";
    const storeValue = store === "All" ? "" : `,'${store}'`;

    if (tag === "totalPurchase") {
      qry =
        "select monthRange.Category,monthRange.poMonth as Xaxis, ISNULL(Amount,0)Yaxis, y,m from ( Select distinct cat.Internal_External as Category, format(Order_Date,@formate)poMonth,year(Order_Date)y,month(Order_Date)m from Stock_PO_Master m cross join (Select distinct Internal_external from Stock_PO_Master Where Internal_External <> @Services AND Internal_External<>@process AND Internal_External<>@Internal )cat Where Order_Date between @fromDate AND @toDate )monthRange left join ( select internal_external as  Category,format(order_Date,@formate) poMonth,Round(ISNULL(SUM(d.NetAmount),0),0)Amount  from Stock_PO_Master m left join Stock_PO_Detail d on m.PONo=d.PONo" +
        `${store === "All" ? "" : " Where d.store=@store"}` +
        " group by  internal_external,format(order_Date,@formate) )data on monthRange.PoMonth=data.poMonth AND monthRange.Category= data.Category order by monthRange.Category,y,m";

      paramType =
        "@formate varchar(15),@fromDate Date,@toDate Date,@Services varchar(50),@Process varchar(50),@Internal varchar(50) " +
        storeParamType;
      paramValues = [
        `'MMM-yyyy','${fromDate}','${toDate}','Services','Process','Internal' ${storeValue}`,
      ];
      const result = await utilityService.executeQuery(
        qry,
        paramType,
        paramValues
      );
      res.send({
        msg: "success",
        data: utilityService.ConvertToChartSeries(
          utilityService.groupBy(result, "Category")
        ),
      });
    } else if (tag === "totalReceiving") {
      qry =
        "select monthRange.Category,monthRange.poMonth as Xaxis, ISNULL(Amount,0)Yaxis, y,m from ( Select distinct cat.ReceiveType as Category,format(dated,@formate)poMonth,year(dated)y,month(dated)m from Stock_Receive_Master m cross join (Select distinct ReceiveType from Stock_Receive_Master Where ReceiveType <> @InternalTransfer  )cat Where dated between @fromDate AND @toDate )monthRange left join ( select ReceiveType as  Category,format(dated,@formate) poMonth,Round(ISNULL(SUM(d.NetAmount),0),0)Amount  from Stock_Receive_Master m left join Stock_Receive_Detail d on m.RecvNo=d.RecvNo " +
        `${store === "All" ? "" : " Where d.store=@store"}` +
        " group by  ReceiveType,format(dated,@formate) )data on monthRange.PoMonth=data.poMonth AND monthRange.Category= data.Category order by monthRange.Category,y,m";

      paramType =
        "@formate varchar(15),@fromDate Date,@toDate Date,@InternalTransfer varchar(50) " +
        storeParamType;
      paramValues = [
        `'MMM-yyyy','${fromDate}','${toDate}','InternalTransfer' ${storeValue}`,
      ];
      const result = await utilityService.executeQuery(
        qry,
        paramType,
        paramValues
      );
      res.send({
        msg: "success",
        data: utilityService.ConvertToChartSeries(
          utilityService.groupBy(result, "Category")
        ),
      });
    }
  } catch (error) {
    res.send({ msg: error, data: [] });
  }
});


module.exports = router