const express=require('express')
const connectDB = require('./db');
connectDB();

const app = express()

app.use(express.json())



//Importing Routers:
const userRouter= require("./routes/users")
const authRouter =require("./routes/authentication")

//Using Routers:
app.use("/users",userRouter)
app.use("/auth",authRouter)

app.listen(3000)