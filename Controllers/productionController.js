const express = require('express');
const utilityService = require('../Services/UtilityService');
const router =  express.Router();


router.get("/productionDashboard", async (req, res) => {
    try {
      let dashboard = [];
      let qry, paramType, paramValues, result,unitIDQry,unitIDPrams,unitIDValue;
      
      let unitID = req.query.unitID;
     unitIDQry = unitID==="000" ? "" : " AND UnitID=@UnitID";
      unitIDPrams = unitID==="000" ? "" : " , @UnitID varchar(10)";
      unitIDValue = unitID==="000" ? "" : `,'${unitID}'`;

       //Total Articles
      qry = "Select ISNULL(Count(*),0)totalArticles from WG_Items Where ISNULL(Active,0)=1 " + unitIDQry;
      paramType = unitIDPrams.split(",")[1];
      paramValues=[ unitIDValue.split(",")[1]];
      result =  await utilityService.executeQuery(qry,paramType,paramValues);
      dashboard.push({
        title: "Total Articles",
        value: result[0].totalArticles,
        tag: "totalArticles" ,
         valuePerc: '0'
      });

      //Open Orders
      qry = "Select Convert(float,ISNULL(Count(*),0))openOrders from WG_Order_Master WHere Order_Category=@orderCategory AND ISNULL(Order_Closed,0)=0" + unitIDQry;
      paramType = "@OrderCategory varchar(20) " + unitIDPrams;
      paramValues= [`'Regular' ${unitIDValue}`] ;
      result =  await utilityService.executeQuery(qry,paramType,paramValues);
      dashboard.push({
        title: "Open Orders",
        value: result[0].openOrders,
        tag: "openOrders" ,
         valuePerc: '0'
      });

      //Late Shipments
      qry = "Select Convert(float,ISNULL(Count(*),0))lateShipments from WG_Order_Master WHere Order_Category=@OrderCategory AND ISNULL(Order_Closed,0)=0 AND ShipmentDate <= Convert(Date,GetDate())" + unitIDQry;
      paramType = "@OrderCategory varchar(20) " + unitIDPrams;
      paramValues= [`'Regular' ${unitIDValue}`] ;
      result =  await utilityService.executeQuery(qry,paramType,paramValues);
      dashboard.push({
        title: "Late Shipments",
        value: result[0].lateShipments,
        tag: "lateShipments" ,
         valuePerc: '0'
      });

      //Upcomming Shipments
      qry = "Select Convert(float,ISNULL(Count(*),0))upCommingShipments from WG_Order_Master WHere Order_Category=@OrderCategory AND ISNULL(Order_Closed,0)=0 AND ShipmentDate > Convert(Date,GetDate())" + unitIDQry;
      paramType = "@OrderCategory varchar(20) " + unitIDPrams;
      paramValues= [`'Regular' ${unitIDValue}`] ;
      result =  await utilityService.executeQuery(qry,paramType,paramValues);
      dashboard.push({
        title: "Upcomming Shipments",
        value: result[0].upCommingShipments,
        tag: "upCommingShipments" ,
         valuePerc: '0'
      });

       //pending BOMs
       qry = "Select Convert(float,ISNULL(Count(*),0))pendingBOMs from WG_Order_Master WHere Order_Category=@OrderCategory AND ISNULL(Order_Closed,0)=0  AND OrderID NOT In (select OrderID from Stock_BOMMaster)" + unitIDQry;
       paramType = "@OrderCategory varchar(20) " + unitIDPrams;
       paramValues= [`'Regular' ${unitIDValue}`] ;
       result =  await utilityService.executeQuery(qry,paramType,paramValues);
       dashboard.push({
         title: "Pending Bill of Materials",
         value: result[0].pendingBOMs,
         tag: "pendingBOMs" ,
          valuePerc: '0'
       });

        //Production Status Received Based
        dashboard.push({
          title: "Production Status",
         tag: "productionStatus" ,
         value:'',
         valuePerc: '0'
        });

        

     res.send({msg:"success",data:dashboard})
    } catch(error) {
        res.send({msg:"error",data:[]});
    }
});

router.get(
  "/productionDashboard/productionDashboardDetail",
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
      if (tag === "totalArticles") {
        qry =
          "select i.ItemID as ID,UnitName as ProductionUnit,ItemID as ArticleNo,Named as Article, c.ProductionName as Customer,i.CustItemCode  from WG_Items i left join CompanyUnit u on UnitID = ID left join Stock_Customers c on i.customerID = c.CustCode " + `${unitID==='000' ?'':' Where i.UnitID=@UnitID'}`;
        paramType = unitIDPrams.split(",")[1];
        paramValues = [unitIDValue.split(",")[1]];
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "openOrders") {
        qry =
          "select m.OrderID as ID,UnitName,c.ProductionName as  Customer,m.OrderID,Order_Date,ShipmentDate,Qty from WG_Order_Master m left join (Select OrderID,SUM(Qty)Qty from WG_Order_Detail group by OrderID )d on m.OrderID = d.OrderID left join CompanyUnit u on m.UnitID = u.ID left join Stock_Customers c on m.CustID = c.CustCode  Where ISNULL(m.Order_Closed,0)=0 AND Order_Category=@OrderCategory " + `${unitID==='000' ?'':' AND m.UnitID=@UnitID'}`;
        paramType = "@OrderCategory varchar(20) " + unitIDPrams;
        paramValues = [`'Regular' ${unitIDValue}`];
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "lateShipments") {
        qry =
          "select m.OrderID as ID,UnitName,c.ProductionName as  Customer,m.OrderID,Order_Date,ShipmentDate,Qty from WG_Order_Master m left join (Select OrderID,SUM(Qty)Qty from WG_Order_Detail group by OrderID )d on m.OrderID = d.OrderID left join CompanyUnit u on m.UnitID = u.ID left join Stock_Customers c on m.CustID = c.CustCode  Where ISNULL(m.Order_Closed,0)=0 AND m.ShipmentDate <= Convert(Date,GetDate())  AND Order_Category=@OrderCategory " + `${unitID==='000' ?'':' AND m.UnitID=@UnitID'}`;
        paramType = "@OrderCategory varchar(20) " + unitIDPrams;
        paramValues = [`'Regular' ${unitIDValue}`];
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "upCommingShipments") {
        qry =
          "select m.OrderID as ID,UnitName,c.ProductionName as  Customer,m.OrderID,Order_Date,ShipmentDate,Qty from WG_Order_Master m left join (Select OrderID,SUM(Qty)Qty from WG_Order_Detail group by OrderID )d on m.OrderID = d.OrderID left join CompanyUnit u on m.UnitID = u.ID left join Stock_Customers c on m.CustID = c.CustCode  Where ISNULL(m.Order_Closed,0)=0 AND m.ShipmentDate > Convert(Date,GetDate())  AND Order_Category=@OrderCategory " + `${unitID==='000' ?'':' AND m.UnitID=@UnitID'}`;
        paramType = "@OrderCategory varchar(20) " + unitIDPrams;
        paramValues = [`'Regular' ${unitIDValue}`];
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "pendingBOMs") {
        qry =
          "select m.OrderID as ID,UnitName,c.ProductionName as  Customer,m.OrderID,Order_Date,ShipmentDate,Qty from WG_Order_Master m left join (Select OrderID,SUM(Qty)Qty from WG_Order_Detail group by OrderID )d on m.OrderID = d.OrderID left join CompanyUnit u on m.UnitID = u.ID left join Stock_Customers c on m.CustID = c.CustCode  Where ISNULL(m.Order_Closed,0)=0 AND m.OrderID NOT IN (select OrderID from Stock_BOMMaster)  AND Order_Category=@OrderCategory " + `${unitID==='000' ?'':' AND m.UnitID=@UnitID'}`;
        paramType = "@OrderCategory varchar(20) " + unitIDPrams;
        paramValues = [`'Regular' ${unitIDValue}`];
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "productionStatus") {
        qry = "Exec sp_PSOrderWiseRecvBased @OrderCategory,@UnitID" ;
        paramType = "@OrderCategory varchar(20) " + unitIDPrams;
        paramValues = [`'Regular' ${unitIDValue}`];
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      else if (tag === "productionStatusArticleWise") {
        qry = "Exec sp_PSItemWiseRecvBased @OrderCategory,@UnitID" ;
        paramType = "@OrderCategory varchar(20) " + unitIDPrams;
        paramValues = [`'Regular' ${unitIDValue}`];
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }
      else if (tag === "productionStatusColorWise") {
        qry = "Exec sp_PSColourWiseRecvBased @OrderCategory,@UnitID" ;
        paramType = "@OrderCategory varchar(20) " + unitIDPrams;
        paramValues = [`'Regular' ${unitIDValue}`];
        result = await utilityService.executeQuery(qry, paramType, paramValues);
      }

      res.send({ msg: "success", data: result });
    } catch (error) {
      res.send({ msg: "error", data: [] });
    }
  }
);


module.exports= router;