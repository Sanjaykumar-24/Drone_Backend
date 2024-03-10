const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const server = express()
server.use(express.json())
const port = process.env.PORT || 2000
server.use(express.urlencoded({urlencoded:false}))
server.use(cors({origin:'*'}))

