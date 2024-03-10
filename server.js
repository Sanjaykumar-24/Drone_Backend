const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const droneRoute = require('./routes/drone')
require('dotenv').config()
const server = express()
server.use(express.json())
const port = process.env.PORT || 2000
server.use(express.urlencoded({urlencoded:false}))
server.use(cors({origin:'*'}))
server.use('/drone',droneRoute)
mongoose.connect(process.env.URI).then(()=>{
    console.log('Database connected sucessfully..!!🙂')
}).catch((error)=>{
    console.error('Datebase connection error..!!😒')
})
server.listen(port,()=>{
    console.log('server started at port',port)
})
