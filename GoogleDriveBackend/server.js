const express=require('express')
const connectDB = require('./db');
connectDB();

const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json())





//Importing Routers:
const userRouter= require("./routes/users")
const authRouter =require("./routes/authentication")
const documentRouter = require("./routes/documents")

//Using Routers:
app.use("/users",userRouter)
app.use("/auth",authRouter)
app.use("/document",documentRouter)


const PORT =3000
app.listen(PORT)