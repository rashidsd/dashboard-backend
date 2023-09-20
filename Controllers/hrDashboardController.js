const express =  require('express');
const router =  express.Router();
const utilityService = require('../Services/UtilityService')


router.get("/hrDashboard", async (req, res) => {
  try {
    let dashboard = [];
    let qry, pramType, pramValues, result, unitID, fromDate,dated;
    let unitIDQry,unitIDPrams,unitIDValue
    let ActiveEmployees;
    unitID = req.query.unitID;
    dated = new Date (req.query.dated);
    fromDate = new Date( dated);
    fromDate =  new Date(fromDate.setDate(-30));
    dated =  utilityService.toQueryDateString(dated);
    fromDate =  utilityService.toQueryDateString(fromDate);

   
        unitIDQry = unitID==="000" ? "" : " AND UnitID=@UnitID";
        unitIDPrams = unitID==="000" ? "" : " , @UnitID varchar(10)";
        unitIDValue = unitID==="000" ? "" : `,'${unitID}'`;

    
    //actaive Employee
    qry =
      "Select ISNULL(Count(*),0)ActiveEmployee from Employee Where Active=@Active AND Employee_Category=@EmployeeCategory " + unitIDQry;
    pramType = "@Active bit,@EmployeeCategory varchar(20) " + unitIDPrams;
    pramValues = [`1,'Employee' ${unitIDValue}`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
    ActiveEmployees=result[0].ActiveEmployee,
    dashboard.push({
      title: "Active Employee",
      value: result[0].ActiveEmployee,
      tag: "activeEmployee" ,
       valuePerc: '100'
    });
   
//Present Employee
qry =
"Select Convert(float,ISNULL(Count(*),0))Present from VAttendance Where Employee_Category=@EmployeeCategory AND Attendance_Date=@AttendanceDate  " + unitIDQry;
pramType = "@EmployeeCategory varchar(20),@AttendanceDate Date " + unitIDPrams;
pramValues = [`'Employee','${dated}' ${unitIDValue}`];
result = await utilityService.executeQuery(qry, pramType, pramValues);
dashboard.push({
title: "Present Employee",
value: result[0].Present,
tag: "presentEmployee",
valuePerc: Math.round(result[0].Present/ActiveEmployees*100)
});


//Absent Employee
qry ="Select Convert(float,ISNULL(Count(*),0))Absent from Employee Where Active=1 AND Employee_Category=@EmployeeCategory "
+ " AND EmployeeID NOT IN (Select EmployeeID from Attendance_Master Where Attendance_Date=@AttendanceDate )" + unitIDQry + "";
pramType =
"@EmployeeCategory varchar(20),@AttendanceDate Date " + unitIDPrams;
pramValues = [`'Employee','${dated}' ${unitIDValue}`];
result = await utilityService.executeQuery(qry, pramType, pramValues);
dashboard.push({
title: "Absent Employee",
value: result[0].Absent,
tag: "absentEmployee",
valuePerc: Math.round(result[0].Absent/ActiveEmployees*100)
});

//Late Commers
qry ="Select Convert(float,ISNULL(Count(*),0))Late from VAttendance Where Employee_Category=@EmployeeCategory "
+ " AND ISNULL(Late_Min,0)>0 AND Attendance_Date=@AttendanceDate " + unitIDQry;
pramType =
"@EmployeeCategory varchar(20),@AttendanceDate Date " + unitIDPrams;
pramValues = [`'Employee','${dated}' ${unitIDValue}`];
result = await utilityService.executeQuery(qry, pramType, pramValues);
dashboard.push({
title: "Late Commers",
value: result[0].Late,
tag: "lateEmployee",
valuePerc: Math.round(result[0].Late/ActiveEmployees*100)
});


    
    //Total Advanve Active
    qry =
      "select Round(ISNULL(SUM(Total_Bal),0),0)TotalAdvance from VTotal_Balance Where Active=@Active AND Employee_Category=@EmployeeCategory " + unitIDQry;
    pramType = "@Active bit,@EmployeeCategory varchar(20) " + unitIDPrams;
    pramValues = [`1,'Employee' ${unitIDValue}`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
    dashboard.push({
      title: "Total Advance (Avtive)",
      value: result[0].TotalAdvance,
      tag: "activeAdvance",
       valuePerc:'100'
    });

    //Total Advanve in-Active
    qry =
      "select Round(ISNULL(SUM(Total_Bal),0),0)TotalAdvance from VTotal_Balance Where Active=@Active AND Employee_Category=@EmployeeCategory " + unitIDQry;
    pramType = "@Active bit,@EmployeeCategory varchar(20) " + unitIDPrams;
    pramValues = [`0,'Employee' ${unitIDValue}`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
    dashboard.push({
      title: "Total Advance (In-active)",
      value: result[0].TotalAdvance,
      tag: "inActiveAdvance",
      valuePerc:'100'
    });

    

     //last 30 days joinings
     qry = " Select Convert(float,ISNULL(Count(*),0))Last30daysJoinings from Employee Where Employee_Category=@EmployeeCategory AND DOJ>=@fromDate AND DOJ<=@toDate " + unitIDQry;
     pramType =
       "@EmployeeCategory varchar(20),@fromDate Date,@toDate Date " + unitIDPrams;
     pramValues = [`'Employee','${fromDate}','${dated}' ${unitIDValue}`];
     result = await utilityService.executeQuery(qry, pramType, pramValues);
     dashboard.push({
       title: "Last 30days Joinings",
       value: result[0].Last30daysJoinings,
       tag: "last30daysJoinings",
       valuePerc: Math.round(result[0].Last30daysJoinings/ActiveEmployees*100)
     });
  

      //last 30 days terminations
      qry = " With cte as (Select Employeeid,Max(Dated)Dated from Employee_Termination Where EmpStatus =@EmpStatus " + unitIDQry + " AND EmployeeID IN (Select EmployeeID from Employee Where Employee_Category=@EmployeeCategory AND ISNULL(Active,0)=0) group by EmployeeID) Select Convert(float,ISNULL(Count(*),0))last30daysTerminations from Cte Where Dated>=@fromDate AND Dated<=@toDate";
      pramType =
        "@EmpStatus varchar(20) " + unitIDPrams + " ,@EmployeeCategory varchar(20),@fromDate Date,@toDate Date";
      pramValues = [`'Termination' ${unitIDValue},'Employee','${fromDate}','${dated}'`];
      result = await utilityService.executeQuery(qry, pramType, pramValues);
      dashboard.push({
        title: "Last 30days Terminations",
        value: result[0].last30daysTerminations,
        tag: "last30daysTerminations",
        valuePerc: Math.round(result[0].last30daysTerminations/ActiveEmployees*100)
      });

    res.send({ msg: "success", data: dashboard });
  } catch (error) {
    res.send({ msg: "error", data: [] });
  }
});
router.get("/hrDashboard/hrDashboardDetail", async (req, res) => {
  try {
  let qry, pramType, pramValues, result, unitID, fromDate, dated;
  let unitIDQry, unitIDPrams, unitIDValue;
  unitID = req.query.unitID;
  dated = new Date(req.query.dated);
  tag = req.query.tag;
  
  dated = new Date (req.query.dated);
  fromDate = new Date( dated);
  fromDate =  new Date(fromDate.setDate(-30));

  dated = utilityService.toQueryDateString (dated);
  fromDate = utilityService.toQueryDateString( fromDate);

  unitIDQry = unitID === "000" ? "" : " AND UnitID=@UnitID";
  unitIDPrams = unitID === "000" ? "" : " , @UnitID varchar(10)";
  unitIDValue = unitID === "000" ? "" : `,'${unitID}'`;
  
  if (tag === "activeEmployee") {
    qry =
      "select EmployeeID as ID, EmployeeID,UnitName as Location,Convert(Date,DOJ)DOJ,Employee_Name,Department_Name,Designation,Mobile_No from VEmployee Where Active=@Active " +
      unitIDQry;
    pramType = "@Active bit " + unitIDPrams;
    pramValues = [`1 ${unitIDValue}`];
  } else if (tag === "presentEmployee") {
    qry =
      "Select VAttendance.EmployeeID as ID, VAttendance.EmployeeID,UnitName as Location,Convert(Date,DOJ)DOJ,Employee_Name,Department_Name,Designation,InTime from VAttendance Left join" +
      "( Select EmployeeID,Attendance_Date as Dated,Min(In_Time)InTime,Max(Out_Time)OutTime from Attendance_Detail d left join Attendance_Master m " + 
      " on  d.AttendanceID = m.AttendanceID Group by EmployeeID,Attendance_Date )InOut on VAttendance.EmployeeID=InOut.EmployeeID AND " +
      " VAttendance.Attendance_Date=InOut.Dated Where Employee_Category=@EmployeeCategory AND VAttendance.Attendance_Date=@AttendanceDate  " +
      unitIDQry;
    pramType =
      "@EmployeeCategory varchar(20),@AttendanceDate Date " + unitIDPrams;
    pramValues = [`'Employee','${dated}' ${unitIDValue}`];
  } else if (tag === "absentEmployee") {
    qry = "Select EmployeeID as ID,EmployeeID,UnitName as Location,Convert(Date,DOJ)DOJ,Employee_Name,Department_Name,Designation,Mobile_No from VEmployee Where Active=1 AND Employee_Category=@EmployeeCategory " +
      " AND EmployeeID NOT IN (Select EmployeeID from Attendance_Master Where Attendance_Date=@AttendanceDate )" +
      unitIDQry +
      "";
    pramType = "@EmployeeCategory varchar(20),@AttendanceDate Date " + unitIDPrams;
    pramValues = [`'Employee','${dated}' ${unitIDValue}`];
  }else if (tag === "lateEmployee") {
    qry ="Select  VAttendance.EmployeeID as ID,VAttendance.EmployeeID,UnitName as Location,Convert(Date,DOJ)DOJ,Employee_Name,Department_Name,Designation,InTime from VAttendance Left join" +
    "( Select EmployeeID,Attendance_Date as Dated,Min(In_Time)InTime,Max(Out_Time)OutTime from Attendance_Detail d left join Attendance_Master m " + 
    " on  d.AttendanceID = m.AttendanceID Group by EmployeeID,Attendance_Date )InOut on VAttendance.EmployeeID=InOut.EmployeeID AND " +
    " VAttendance.Attendance_Date=InOut.Dated Where Employee_Category=@EmployeeCategory "
    + " AND ISNULL(Late_Min,0)>0 AND Attendance_Date=@AttendanceDate " + unitIDQry;
    pramType =
    "@EmployeeCategory varchar(20),@AttendanceDate Date " + unitIDPrams;
    pramValues = [`'Employee','${dated}' ${unitIDValue}`];
  }else if (tag==='activeAdvance') {
    qry =
      "select EmployeeID as ID,EmployeeID,UnitName as Location,Convert(Date,DOJ)DOJ,Employee_Name,Department_Name,Designation,Mobile_No,Total_Bal as Advance from VTotal_Balance Where Active=@Active AND Employee_Category=@EmployeeCategory " + unitIDQry;
    pramType = "@Active bit,@EmployeeCategory varchar(20) " + unitIDPrams;
    pramValues = [`1,'Employee' ${unitIDValue}`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  }else if (tag==='inActiveAdvance') {
    qry =
      "select EmployeeID as ID,EmployeeID,UnitName as Location,Convert(Date,DOJ)DOJ,Employee_Name,Department_Name,Designation,Mobile_No,Total_Bal as Advance from VTotal_Balance Where Active=@Active AND Employee_Category=@EmployeeCategory " + unitIDQry;
    pramType = "@Active bit,@EmployeeCategory varchar(20) " + unitIDPrams;
    pramValues = [`0,'Employee' ${unitIDValue}`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  } else if (tag==='last30daysJoinings') {
    qry = "Select EmployeeID as ID,EmployeeID,UnitName as Location,Convert(Date,DOJ)DOJ,Employee_Name,Department_Name,Designation,Mobile_No from VEmployee Where Employee_Category=@EmployeeCategory AND DOJ>=@fromDate AND DOJ<=@toDate " + unitIDQry;
    pramType =
      "@EmployeeCategory varchar(20),@fromDate Date,@toDate Date " + unitIDPrams;
    pramValues = [`'Employee','${fromDate}','${dated}' ${unitIDValue}`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  }else if (tag==='last30daysTerminations') {
    qry = " With cte as (Select Employeeid,Max(Dated)Dated from Employee_Termination Where EmpStatus =@EmpStatus " + unitIDQry + " AND EmployeeID IN (Select EmployeeID from Employee Where Employee_Category=@EmployeeCategory AND ISNULL(Active,0)=0) group by EmployeeID) Select cte.EmployeeID as ID,cte.EmployeeID,UnitName as Location,Convert(Date,DOJ)DOJ,Employee_Name,Department_Name,Designation,Mobile_No from Cte left join VEmployee e on cte.EmployeeID=e.EmployeeID Where Dated>=@fromDate AND Dated<=@toDate";
    pramType =
      "@EmpStatus varchar(20) " + unitIDPrams + " ,@EmployeeCategory varchar(20),@fromDate Date,@toDate Date";
    pramValues = [`'Termination' ${unitIDValue},'Employee','${fromDate}','${dated}'`];
    result = await utilityService.executeQuery(qry, pramType, pramValues);
  }


    result = await utilityService.executeQuery(qry, pramType, pramValues);
    res.send({ msg: "success", data: result });
  }
  catch (error) {
    res.send({ msg: "error", data: [] });
  }
});

module.exports = router;
