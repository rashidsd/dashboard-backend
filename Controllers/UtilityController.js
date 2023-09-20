const express = require("express");
const utilityService = require("../Services/UtilityService");


const router = express.Router();

router.get("/companyInfo", async (req, res) => {
    try {
      const data = await utilityService.getCompanyInfo();
      res.send({msg:'Success',data:data});
      } catch (error) {
     res.send({msg:'Fail',data:[]});
    }
  });

router.get("/productionUnits",async(req,res)=>{
  try {
    const data = await utilityService.getProductionUnits();
    res.send({msg:'Success',data:data});
    } catch (error) {
   res.send({msg:'Fail',data:[]});
  }
});

router.get("/productionUnitsWithAll",async(req,res)=>{
  try {
    const data = await utilityService.getProductionUnitsWithAll();
    res.send({msg:'Success',data:data});
    } catch (error) {
   res.send({msg:'Fail',data:[]});
  }
})

router.get("/StockStoresWithAll",async(req,res)=>{
  try {
    let qry = "Select 'All' as StoreName UNION ALL select Store_Name as StoreName from Stock_Store "
    const data = await utilityService.executeQuery(qry);
       res.send({msg:'Success',data:data});
    } catch (error) {
   res.send({msg:'Fail',data:[]});
  }
})

  module.exports = router;
