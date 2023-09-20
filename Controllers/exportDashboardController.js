const express = require('express');
const utilityService = require('../Services/UtilityService');
const router =  express.Router();


router.get("/exportDashboard", async (req, res) => {
    try {
      let dashboard = [];
      let qry, paramType, paramValues, result,unitIDQry,unitIDPrams,unitIDValue;
      
      let unitID = req.query.unitID;
     unitIDQry = unitID==="000" ? "" : " AND UnitID=@UnitID";
      unitIDPrams = unitID==="000" ? "" : " , @UnitID varchar(10)";
      unitIDValue = unitID==="000" ? "" : `,'${unitID}'`;

      //Open Performa Invoices
      qry = "select  Convert(float,ISNULL(Count(distinct m.PerformaInvoiceNo),0))openPerformaInvoices from Export_PerformaInvoiceMaster m left join Export_PerformaInvoiceDetail d on m.PerformaInvoiceNo = d.PerformaInvoiceNo left join WG_Items i on d.ItemID = i.ItemID Where PIStatus=@PIStatus" + unitIDQry;
      paramType = "@PIStatus varchar(20) " + unitIDPrams;
      paramValues= [`'Ready For Production' ${unitIDValue}`] ;
      result =  await utilityService.executeQuery(qry,paramType,paramValues);
      dashboard.push({
        title: "Open Performas",
        value: result[0].openPerformaInvoices,
        tag: "openPerformas" ,
        valuePerc: '0'
      });

       //Over Date Perormas
       qry = "select Convert(float,ISNULL(Count(Distinct m.PerformaInvoiceNo),0))overDateShipments from Export_PerformaInvoiceMaster m left join Export_PerformaInvoiceDetail d on m.PerformaInvoiceNo = d.PerformaInvoiceNo left join WG_Items i on d.ItemID = i.ItemID Where PIStatus=@PIStatus AND ShipmentDate <= Convert(Date,GetDate())" + unitIDQry;
       paramType = "@PIStatus varchar(20) " + unitIDPrams;
       paramValues= [`'Ready For Production' ${unitIDValue}`] ;
       result =  await utilityService.executeQuery(qry,paramType,paramValues);
       dashboard.push({
         title: "Over Date Shipments",
         value: result[0].overDateShipments,
         tag: "overDateShipments" ,
         valuePerc: '0'
       });

        //Upcomming Performas in nest 7 days
        qry = "select Convert(float,ISNULL(Count(Distinct m.PerformaInvoiceNo),0))nextSevenDays from Export_PerformaInvoiceMaster m left join Export_PerformaInvoiceDetail d on m.PerformaInvoiceNo = d.PerformaInvoiceNo left join WG_Items i on d.ItemID = i.ItemID Where PIStatus=@PIStatus AND ShipmentDate between DATEADD(day,-7, Convert(Date,GetDate())) AND Convert(Date,GetDate())" + unitIDQry;
        paramType = "@PIStatus varchar(20) " + unitIDPrams;
        paramValues= [`'Ready For Production' ${unitIDValue}`] ;
        result =  await utilityService.executeQuery(qry,paramType,paramValues);
        dashboard.push({
          title: "Next 7 Days Shipments",
          value: result[0].nextSevenDays,
          tag: "nextSevenDays" ,
          valuePerc: '0'
        });

         //In-Process Performas
         qry = "select Convert(float,ISNULL(Count(Distinct m.PerformaInvoiceNo),0))inProcess from Export_PerformaInvoiceMaster m left join Export_PerformaInvoiceDetail d on m.PerformaInvoiceNo = d.PerformaInvoiceNo left join WG_Items i on d.ItemID = i.ItemID Where PIStatus=@PIStatus " + unitIDQry;
         paramType = "@PIStatus varchar(20) " + unitIDPrams;
         paramValues= [`'In Process' ${unitIDValue}`] ;
         result =  await utilityService.executeQuery(qry,paramType,paramValues);
         dashboard.push({
           title: "In-Process Performas",
           value: result[0].inProcess,
           tag: "inProcess" ,
           valuePerc: '0'
         });

          //Pending Payments Performas
          qry = "select Convert(float,ISNULL(Count(*),0))pendingPayments from Export_VPerformaInvoicePaymentStatus where Balance>0"
         
          result =  await utilityService.executeQuery(qry,paramType,paramValues);
          dashboard.push({
            title: "Pending Payment PIs",
            value: result[0].pendingPayments,
            tag: "pendingPayments" ,
            valuePerc: '0'
          });


          //expected Payment Performas
          qry = "select Convert(float,(ISNULL(Count(*),0)))expectedPayments from Export_Payments where Dated > Convert(Date,GetDate()) and PaymentType =@PaymentType"
          paramType = "@PaymentType varchar(20) " 
          paramValues= [`'Expected'`] ;
          result =  await utilityService.executeQuery(qry,paramType,paramValues);
          dashboard.push({
            title: "Expected Payment PIs",
            value: result[0].expectedPayments,
            tag: "expectedPayments" ,
            valuePerc: '0'
          });
     res.send({msg:"success",data:dashboard})
    } catch(error) {
        res.send({msg:"error",data:[]});
    }
});

router.get("/exportDashboard/exportDashboardDetail",
  async (req, res) => {
    try {
      let qry,
        paramType,
        paramValues,
        result,
        unitIDQry,
        unitIDPrams,
        unitIDValue;

      let unitID = req.query.unitID;
      const tag = req.query.tag;
      unitIDQry = unitID === "000" ? "" : " AND UnitID=@UnitID";
      unitIDPrams = unitID === "000" ? "" : " , @UnitID varchar(10)";
      unitIDValue = unitID === "000" ? "" : `,'${unitID}'`;
     
      if (tag === "openPerformas") {
        qry = "select ROW_NUMBER() over (order by GetDate())ID,d.UnitID,UnitName,m.PerformaInvoiceNo,m.Dated,m.ShipmentDate,c.CustName as Customer,ISNULL(d.PIQty,0)PIQty,ISNULL(o.OrderQty ,0)ProdQty,ISNULL(O.OrderID,'''')ProdOrderNo  from Export_PerformaInvoiceMaster m left join ( select UnitID,UnitName,PerformaInvoiceNo,SUM(Qty)PIQty from Export_vPerformaInvoiceDetail Group by UnitID,UnitName,PerformaInvoiceNo ) d on m.PerformaInvoiceNo = d.PerformaInvoiceNo left join (Select UnitID,od.OrderID ,od.PerformaInvoiceNo,SUM(Qty)OrderQty from WG_Order_Detail Od left join WG_Order_Master Om on od.OrderID = om.OrderID  Group by UnitID ,od.OrderID,od.PerformaInvoiceNo )o on m.PerformaInvoiceNo = o.PerformaInvoiceNo and d.UnitID = o.UnitID  left join Stock_Customers c on m.CustomerID = c.CustCode Where PIStatus=@PIStatus " + `${unitID === "000" ? "" : " AND d.UnitID=@UnitID"} order by PerformaInvoiceNo`;
        paramType = "@PIStatus varchar(20) " + unitIDPrams;
        paramValues= [`'Ready For Production' ${unitIDValue}`] ;
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }
      else if (tag === "overDateShipments") {
        qry = "select d.UnitID,UnitName,m.PerformaInvoiceNo,m.Dated,m.ShipmentDate,c.CustName as Customer,ISNULL(d.PIQty,0)PIQty,ISNULL(o.OrderQty ,0)ProdQty,ISNULL(O.OrderID,'''')ProdOrderNo,ROW_NUMBER() over (order by GetDate())ID  from Export_PerformaInvoiceMaster m left join ( select UnitID,UnitName,PerformaInvoiceNo,SUM(Qty)PIQty from Export_vPerformaInvoiceDetail Group by UnitID,UnitName,PerformaInvoiceNo ) d on m.PerformaInvoiceNo = d.PerformaInvoiceNo left join (Select UnitID,od.OrderID ,od.PerformaInvoiceNo,SUM(Qty)OrderQty from WG_Order_Detail Od left join WG_Order_Master Om on od.OrderID = om.OrderID  Group by UnitID ,od.OrderID,od.PerformaInvoiceNo )o on m.PerformaInvoiceNo = o.PerformaInvoiceNo and d.UnitID = o.UnitID  left join Stock_Customers c on m.CustomerID = c.CustCode Where PIStatus=@PIStatus AND ShipmentDate <= Convert(Date,GetDate())  " + `${unitID === "000" ? "" : " AND d.UnitID=@UnitID"} order by PerformaInvoiceNo `;
        paramType = "@PIStatus varchar(20) " + unitIDPrams;
        paramValues= [`'Ready For Production' ${unitIDValue}`] ;
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "nextSevenDays") {
        qry = "select d.UnitID,UnitName,m.PerformaInvoiceNo,m.Dated,m.ShipmentDate,c.CustName as Customer,ISNULL(d.PIQty,0)PIQty,ISNULL(o.OrderQty ,0)ProdQty,ISNULL(O.OrderID,'''')ProdOrderNo,ROW_NUMBER() over (order by GetDate())ID  from Export_PerformaInvoiceMaster m left join ( select UnitID,UnitName,PerformaInvoiceNo,SUM(Qty)PIQty from Export_vPerformaInvoiceDetail Group by UnitID,UnitName,PerformaInvoiceNo ) d on m.PerformaInvoiceNo = d.PerformaInvoiceNo left join (Select UnitID,od.OrderID ,od.PerformaInvoiceNo,SUM(Qty)OrderQty from WG_Order_Detail Od left join WG_Order_Master Om on od.OrderID = om.OrderID  Group by UnitID ,od.OrderID,od.PerformaInvoiceNo )o on m.PerformaInvoiceNo = o.PerformaInvoiceNo and d.UnitID = o.UnitID  left join Stock_Customers c on m.CustomerID = c.CustCode Where PIStatus=@PIStatus AND ShipmentDate between DATEADD(day,-7, Convert(Date,GetDate())) AND Convert(Date,GetDate()) " + `${unitID === "000" ? "" : " AND d.UnitID=@UnitID"} order by PerformaInvoiceNo  `;
        paramType = "@PIStatus varchar(20) " + unitIDPrams;
        paramValues= [`'Ready For Production' ${unitIDValue}`] ;
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "inProcess") {
        qry = "select d.UnitID,UnitName,m.PerformaInvoiceNo,m.Dated,m.ShipmentDate,c.CustName as Customer,ISNULL(d.PIQty,0)PIQty,ISNULL(o.OrderQty ,0)ProdQty,ISNULL(O.OrderID,'''')ProdOrderNo,ROW_NUMBER() over (order by GetDate())ID  from Export_PerformaInvoiceMaster m left join ( select UnitID,UnitName,PerformaInvoiceNo,SUM(Qty)PIQty from Export_vPerformaInvoiceDetail Group by UnitID,UnitName,PerformaInvoiceNo ) d on m.PerformaInvoiceNo = d.PerformaInvoiceNo left join (Select UnitID,od.OrderID ,od.PerformaInvoiceNo,SUM(Qty)OrderQty from WG_Order_Detail Od left join WG_Order_Master Om on od.OrderID = om.OrderID  Group by UnitID ,od.OrderID,od.PerformaInvoiceNo )o on m.PerformaInvoiceNo = o.PerformaInvoiceNo and d.UnitID = o.UnitID  left join Stock_Customers c on m.CustomerID = c.CustCode Where PIStatus=@PIStatus  " + `${unitID === "000" ? "" : " AND d.UnitID=@UnitID"} order by PerformaInvoiceNo `;
        paramType = "@PIStatus varchar(20) " + unitIDPrams;
        paramValues= [`'In Process' ${unitIDValue}`] ;
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "pendingPayments") {
        qry = "select PerformaInvoiceNo,Dated,CustName as Customer,MarchandiserName as Marchandiser,ShipmentDate ,PaymentTerms,TotalAmount,ForeignCurrency as Currency ,AdvanceRecv as Advance,Received,Credit,Balance,PIStatus,CommercialInvNos,Row_Number() Over (Order by GetDate())ID from Export_VPerformaInvoicePaymentStatus Where Balance>0";
      
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "expectedPayments") {
        qry = "Select DetaIlIndex as ID,p.PerformaInvoiceNo,m.CustName as Customer,p.Dated as PaymentDate,Amount,Currency,RecvRemarks as Remarks   from Export_Payments p Left join Export_VPerformaInvoiceMaster m on p.PerformaInvoiceNo = m.PerformaInvoiceNo Where p.Dated >=Convert(Date,GetDate()) AND p.PaymentType =@PaymentType";
        paramType = "@PaymentType varchar(20) "
        paramValues= [`'Expected'`] ;
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      

      res.send({ msg: "success", data: result });
    } catch (error) {
      res.send({ msg: "error", data: [] });
    }
  }
);



module.exports= router;