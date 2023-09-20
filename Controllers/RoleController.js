const express = require("express");
const roleService = require("../Services/RoleService");
const router = express.Router();


router.get("/getAllRoles", async (req, res) => {
  try {
    const data = await roleService.getAllRoles();
    res.send({msg: "success", data:data[0]});
  } catch (error) {
    res.send({msg: "Fail", data:[]});
  }
});

router.get("/getUserRoles/:UserID", async (req, res) => {
    try {
        const UserID= req.params.UserID;
      const data = await roleService.getUserRoles(UserID);
      res.send({msg: "success", data:data[0]});
    } catch (error) {
      res.send({msg:"Fail", data:[]});
    }
  });

router.post("/AddRole",async (req, res) => {
  try {
    if (!req.body.roleName) {
      res.send({mdg :"Invalid role Name", data:[]});
    } else {
      await roleService.AddRole(req.body.roleName);
      res.send({msg: "Role created successfully!", data:[]});
    }
  } catch (error) {
    res.send({msg: "Fail",data: []});
  }
});

router.post("/updateRoles", async (req, res) => {
  try {
    if (!req.body.UserID) {
      res.send(sendResponse(401, "Invalid UserID", ""));
    } else if (!req.body.roles) {
      res.send({ msg: "Invalid roles", data: [] });
    } else {
      const result = await roleService.updateRoles(
        req.body.UserID,
        req.body.roles
      );

      res.send({ msg: "Roles updated", data: [] });
    }
  } catch (error) {
    res.send({ msg: "Fail to update", data: [] });
  }
});

module.exports = router;