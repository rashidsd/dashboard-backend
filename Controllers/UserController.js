const express = require("express");
const userService = require("../Services/UserService");
const roleService =  require('../Services/RoleService')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtAuthenticate = require('../Auth');


const router = express.Router();


chkUserConstraint = async (req,res,next)=> {
  userName = req.body.data.userName
  const data = await userService.getUserByName(userName);
  if (!userName) {
    return res.send({msg:'please provide a valid User name',data:[]});
   } else if(Number(data[0].userFound)>0) {
    return res.send({msg:'User already exists',data:[]});
   }
   else next()
}
getHashPassword = (plainPassword)=> {
 const salt = bcrypt.genSaltSync(10);
 const hash = bcrypt.hashSync(plainPassword, salt);
return hash
}

router.get("/", async (req, res) => {
  try {
    const data = await userService.getAllUsers();
    res.send({msg:'Success',data:data});
  } catch (error) {
       res.send({msg:'Fail',data:[]});
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id =  req.params.id;
    const data = await userService.getUserById(id);
    res.send({msg:'Success',data:data});
  } catch (error) {
    res.send({msg:'Fail',data:[]});
  }
});
router.post("/Login", async (req, res) => {
  try {
   const userName= req.body.data.userName;
   const Password =  req.body.data.Password;
     const data = await userService.getUserByName(userName);
     if (Number(data[0].userFound)>0) {
      const hasPassword =  await userService.getHashPasswordByUserName(userName)
    
      const match = await bcrypt.compare(Password, hasPassword[0].HashPassword);
       if(match) {
       
       const userRoles = await roleService.getUserRolesAssigned(userName)
       var token = jwt.sign({ userInfo:{ userName: userName,roles:userRoles[0]} }, process.env.SECRET_KEY);
       userService.updateToken(userName,token)
       const ERPID = await userService.getERPIDByUserName(userName);
       const photo=await userService.getUserImage(ERPID);
        res.send({msg:'Success',data:{token:token,photo:photo}});
      }else {
      
        res.send({msg:'Invalid Password',data:[]});
      }

    }else {
      res.send({msg:'Invalid User',data:[]});
    }
    
  } catch (error) {
    console.log(error);
    res.send({msg:'Fail',data:[]});
  }
});

  router.post("/AddUser",chkUserConstraint, async (req, res) => {
    try {
     const {HashPassword,userName,EMail,ERPID} = req.body.data;
      const hash = getHashPassword(HashPassword)
      userService.AddUser(userName,EMail,ERPID,hash,'','')
      res.send({msg:'created',data:[]});
    } catch (error) {
      res.send({msg:'Fail to create',data:[]});
    }
  });


router.post("/delete/:id", async (req, res) => {
    try {
      const data = await userService.deleteUser(req.params.id);
      res.send(sendResponse(200,'Deleted',data));
    } catch (error) {
      res.send({msg:'Fail to Delete',data:[]});
    }
  });
 

module.exports = router;
