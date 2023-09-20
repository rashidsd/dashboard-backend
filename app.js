const express = require('express')
const app = express();
var cors = require('cors');
const userController =  require('./Controllers/UserController');
const utilityController =  require('./Controllers/UtilityController');
const roleController = require('./Controllers/RoleController');
const hrDashboardController = require('./Controllers/hrDashboardController');
const accountDashboardController = require('./Controllers/acccountDashboardController');
const stockDashboardController =  require('./Controllers/stockDashboardController');
const chartController =  require('./Controllers/chartController');
const productionController = require('./Controllers/productionController');
const exportDashboardController = require('./Controllers/exportDashboardController')

var whitelist = ['http://103.149.32.154:5001','http://localhost:5001']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors(corsOptions ))
app.use ("/user",userController) ;
app.use ("/utility",utilityController) ;
app.use ("/Role",roleController);
app.use("/dashboard",hrDashboardController);
app.use("/dashboard",accountDashboardController);
app.use("/dashboard",stockDashboardController);
app.use("/dashboard",chartController);
app.use("/dashboard",productionController);
app.use("/dashboard",exportDashboardController);


app.listen(process.env.SERVER_PORT || 5002,()=> {
    console.log(`SERVER IS RUNNING ON PORT ${process.env.SERVER_PORT}`)
})
