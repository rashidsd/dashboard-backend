const sql = require("mssql");
const async = require('async');


const dbconfig = require("../dbConfig.js");
AddRole = async (roleName) => {
    let pool = await sql.connect(dbconfig)
    let result = await pool.request()
    .input("roleName",sql.VarChar(100),roleName)
    .query("Insert into Dashboard_Roles (RoleName) values(@roleName)");
   return roleName;
  };

  getAllRoles = async () => {
    let pool = await sql.connect(dbconfig)
    let result = await pool.request()
    .query("Select RoleId,RoleName from Dashboard_Roles");
    return result.recordsets;
  
  };

  getUserRoles = async (UserID) => {
    let pool = await sql.connect(dbconfig)
    let result = await pool.request()
    .input("UserID",sql.Int,UserID)
    .query("Select RoleId,RoleName,Assign from Dashboard_VUserRoles Where UserID=@UserID");
    return result.recordsets;
  };

  
  getUserRolesAssigned = async (userName) => {
    let pool = await sql.connect(dbconfig)
    let result = await pool.request()
    .input("UserName",sql.VarChar(100),userName)
    .query("Select RoleName,ERPID from Dashboard_VUserRoles Where Assign=1 AND UserName=@UserName");
    return result.recordsets;
  };

  const MakeQuries = (roles,UserID)=> {
    const Quries = [];
    const firstQry = `Delete from Dashboard_UserRoles Where UserID=${UserID}`;
    Quries.push(firstQry);
    roles.forEach((role)=>{
      if (Number(role.Assign)==1) {
      const query = `insert into Dashboard_UserRoles (UserID,RoleID) Values(${UserID},${role.RoleId})`
      Quries.push(query);
      }
    })
  return Quries
  }
  
 updateRoles = async (UserID,roles)=> {
const postResults=[]
  let pool = await sql.connect(dbconfig)
  var transaction = new sql.Transaction(pool);
  transaction.begin(function(err) {
      if (err) {
          return console.error('Error in transaction begin', err);
      }
  
        var request = new sql.Request(transaction);
        var listQuery= setUpMultipleQueries(MakeQuries(roles,UserID), request);  
  
        async.series( listQuery,
  
      function(err, results) {
      
          if (err) {
              console.error('Error in queries, rolling back', err);
              return transaction.rollback();
          }
          transaction.commit(function(err) {
              if (err) {
                  return console.error('Error in commit', err);
              }
            // console.log(results);
             postResults.push(results);
          });
      });
  });
  return postResults;
}

  function setUpMultipleQueries(listQuery, request){
    var requestObject= {};
    listQuery.forEach(function(query, index){
     requestObject['q'+index]= function(callback){
              request.query(query, callback);
        };
    });
    //return requestObject;
    return requestObject;
  };

  module.exports = {
    AddRole,
    getAllRoles,
    getUserRoles,
    getUserRolesAssigned,
    updateRoles
  };
  