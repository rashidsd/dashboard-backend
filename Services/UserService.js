const sql = require("mssql");
const dbconfig = require("../dbConfig.js");



AddUser = async (UserName,EMail,ERPID,HashPassword) => {
    let pool = await sql.connect(dbconfig)
      let result = await pool.request()
      .input("UserName",sql.VarChar(100),UserName)
      .input("EMail",sql.VarChar(100),EMail)
      .input("ERPID",sql.VarChar(100),ERPID)
      .input("HashPassword",sql.VarChar(100),HashPassword)
     .query("Insert into Dashboard_Users (UserName, EMail, ERPID, HashPassword) " +
             "Values (@UserName,@EMail,@ERPID,@HashPassword)")
  return result.recordsets[0];
};

getAllUsers = async () => {
  let pool = await sql.connect(dbconfig)
    let result = await pool.request().query("Select * from Dashboard_Users");
return result.recordsets[0];
};

getUserById = async (Id) => {
    let pool = await sql.connect(dbconfig)
  let result = await pool.request()
    .input("UserId", sql.BigInt, Id)
    .query("Select * from Dashboard_Users Where UserID=@UserId");
  return result.recordsets[0];
};

getUserByName = async (userName) => {
    let pool = await sql.connect(dbconfig)
  let result = await pool.request()
    .input("UserName", sql.VarChar, userName)
    .query("Select ISNULL(Count(*),0)count from Dashboard_Users Where UserName=@UserName");
  //console.log('from get by user Name',result.recordsets[0])
    return result.recordsets[0];
};

deleteUser = async (Id) => {
    let pool = await sql.connect(dbconfig)
  let result = await pool.request()
    .input("UserId", sql.BigInt, Id)
    .query("Delete from Dashboard_Users Where UserID=@UserId");
  return result.recordsets[0];
};

getUserByName = async (userName) => {
    let pool = await sql.connect(dbconfig)
  let result = await pool.request()
  .input("userName", sql.VarChar(100), userName)
  .query("Select ISNULL(Count(*),0)userFound from Dashboard_Users Where UserName=@userName");
 return result.recordsets[0];
};

getHashPasswordByUserName = async (userName) => {
  let pool = await sql.connect(dbconfig)
let result = await pool.request()
  .input("UserName", sql.VarChar(100), userName)
  .query("Select HashPassword from Dashboard_Users Where UserName=@UserName");
  return result.recordsets[0];

};

getERPIDByUserName = async (userName) => {
  let pool = await sql.connect(dbconfig)
let result = await pool.request()
  .input("UserName", sql.VarChar(100), userName)
  .query("Select ERPID from Dashboard_Users Where UserName=@UserName");
  return result.recordsets[0][0].ERPID;

};
updateToken = async (userName,token) => {
  let pool = await sql.connect(dbconfig)
let result = await pool.request()
  .input("UserName", sql.VarChar(100), userName)
  .input("token", sql.VarChar(sql.MAX), token)
  .query("Update Dashboard_Users set token=@token Where UserName=@UserName");
  return result.recordsets[0];
};

getUserImage = async (ERPID) => {
  let pool = await sql.connect(dbconfig)
  let result = await pool.request()
  .input("ERPID", sql.VarChar(100), ERPID)
  .query("Select photo  from Employee Where EmployeeID =@ERPID");
  if (result.recordsets[0][0]===undefined) {
    return null
  }
   const b64 = Buffer.from(result.recordsets[0][0].photo).toString('base64');
   const photo = `data:image/jpeg;base64,${b64}`
  
    return photo;
};


module.exports = {
  AddUser,
  getAllUsers,
  getUserById,
  deleteUser,
  getUserByName,
  getERPIDByUserName,
  getUserImage,
  getHashPasswordByUserName,
  updateToken,

};
