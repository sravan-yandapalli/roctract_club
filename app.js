const express=require("express");
const { Pool }=require("pg");
const doenv=require("dotenv");
const path=require("path");
const hbs=require("hbs");
const cookieParser=require("cookie-parser");
const bodyParser=require('body-parser');

const app=express();

doenv.config({
  path:"./.env",
});
const pool = new Pool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT,
    ssl: true
});

pool.connect((err)=>{
  if(err){
  console.log(err);
  }else{
    console.log("connection success with db");
  }
});

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
 

// console.log(__dirname);
const location=path.join(__dirname,"./public");
app.use(express.static(location));
app.set("view engine","hbs");

const partialsPath=path.join(__dirname,"./views/partials");
hbs.registerPartials(partialsPath);

app.use('/',require("./routes/pages"));
app.use('/auth',require("./routes/auth"));


