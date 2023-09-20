const jwt = require('jsonwebtoken')

const jwtAuthenticate = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.send({ msg: "please provide a token", data: [] });
  } else {
    jwt.verify(token, process.env.SECRET_KEY,(err,decoded)=>{
        if (err) {
            return res.send({ msg: "please provide a valid token", data: [] });
          }
        next();
    });
  }
};
module.exports = jwtAuthenticate