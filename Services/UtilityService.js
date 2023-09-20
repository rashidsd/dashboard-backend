const sql = require("mssql");
const dbconfig = require("../dbConfig.js");

getCompanyInfo = async () => {
    let pool = await sql.connect(dbconfig)
    let result = await pool.request().query("Select Company_Name,Company_Logo logo from Company");
    const Company_Name =  result.recordsets[0][0].Company_Name 
     const b64 = Buffer.from(result.recordsets[0][0].logo).toString('base64');
     const logo = `data:image/png;base64,${b64}`
      return {"Company_Name":Company_Name,"logo":logo};
  };

  getProductionUnitsWithAll = async () => {
    let pool = await sql.connect(dbconfig)
    let result = await pool.request().query("Select '000' as UnitID,'All' as UnitName UNION ALL Select  ID as UnitID,UnitName  from CompanyUnit");
    return result.recordsets[0];
  };
  getProductionUnits = async () => {
    let pool = await sql.connect(dbconfig)
    let result = await pool.request().query("Select  ID as UnitID,UnitName  from CompanyUnit");
    return result.recordsets[0];
  };

    executeQryWithOutPrams = async (qry)=>{
    let pool = await sql.connect(dbconfig)
   let result = await pool.request().query(qry);
    //console.log(result.recordsets[0][0].totalArticles);
    return result.recordsets[0];
  }

  executeQryWithPrams = async (qry,pramsType,pramsValue)=>{
    let pool = await sql.connect(dbconfig)
      const newQry = `sp_executesql N'${qry}',N'${pramsType}',${[...pramsValue]} `
   //console.log(newQry);
    let result = await pool.request().query(newQry);
    return result.recordsets[0];
  }

  executeQuery = async (qry, pramsType, pramsValue) => {
    if (pramsType) return await executeQryWithPrams(qry, pramsType, pramsValue);
    else return await executeQryWithOutPrams(qry);
  };

  const  groupBy = (objectArray, property)=> {
    return objectArray.reduce(function (accumulator, currentObject) {
      let key = currentObject[property];
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(currentObject);
      return accumulator;
    }, {});
  }

  const ConvertToChartSeries =(data)=> {
    var Series =[];
    for (const prop in data) {
      var seriesData =[];
       data[prop].forEach(row => {
         seriesData = [...seriesData,{x:row.Xaxis,y:row.Yaxis}]
      });
       Series = [...Series,{name:prop,data:seriesData}]
     }
     return Series;
  }

  const toQueryDateString = dated =>  `${(dated.getMonth()+1).toString().padStart(2,0)}/${dated.getUTCDate().toString().padStart(2,0)}/${dated.getFullYear()}`


  module.exports = {
    getCompanyInfo,
    getProductionUnits,
    getProductionUnitsWithAll,
    executeQuery,
    toQueryDateString,
    groupBy,
    ConvertToChartSeries
  };
  