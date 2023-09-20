const dotenv = require('dotenv');
dotenv.config();

const sqlconfig = {
  port: parseInt(process.env.DB_PORT, 10),
  server: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  stream: false,
  requestTimeout : 120000,
  connectionTimeout: 15000,
  options: {
    trustedConnection: true,
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
//   pool: {
//     max: 10,
//     min: 0,
//     evictionRunIntervalMillis: 1000,
//     idleTimeoutMillis: 1000
// }
};
module.exports =sqlconfig