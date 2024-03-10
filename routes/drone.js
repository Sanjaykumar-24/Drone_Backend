const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone')
require('dotenv').config()
const loginModel = require('../schemas/logindb');
const droneModel = require('../schemas/dronedb');
router.post('/login', async(req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ message: "all feilds required" })
    }
    const user = await loginModel.findOne({username:username});
    if(!user)
    {
        return res.json({message:"failed",error:"admin not found"});
    }
    if(user.password != password)
    {
        return res.json({message:"failed",error:"wrong password"});
    }
    const token = jwt.sign({id:user.id},
        process.env.SECRET_KEY,
        {
            expiresIn:'20d'
        })
    return res.status(200).json({message:"login successfull",token:token});
})


////////////////////////////////////////////////////////////////////////////////////////////////


const verify = async(req,res,next)=>{
    const token = req.headers.authorization.split(" ")[1];
    if(!token)
    {
        return res.json({message:'failed',error:'token not found'})
    }
    jwt.verify(
        token,
        process.env.SECRET_KEY,
        async(err,user)=>{
            if(err)
            {
                return res.json({message:'failed',error:err.message})
            }
            const data = await loginModel.findById(user.id)
            if(!data)
            {
                return res.json({message:'failed',error:'invaild user'})
            }
            req.userId = user.id
            next()
        }
        )
}
router.post('/data',verify,async(req,res)=>{
     const data = req.body
     const userId = req.userId
     const format = 'hh:mm A'
     data.StartTime = moment.tz(data.StartTime,format,'Asia/Kolkata').utc()
     data.EndTime = moment.tz(data.EndTime,format,'Asia/Kolkata').utc()
     const minutes = data.EndTime.diff(data.StartTime,'minutes')
     const hours = Math.floor(minutes/60)
     const min = minutes%60
     const duration = hours+'h'+':'+min+'m'
     data.StartTime = data.StartTime.format('HH:mm')
     data.EndTime = data.EndTime.format('HH:mm')
     const user = await loginModel.findById(userId)
     data.Duration = duration
     data.Trainer = user.username
     const info = await droneModel.create(data)
     info.save()
     if(!info)
     {
        return res.json({message:'failed',error:'failed to add data'})
     }
     return res.json({message:'success'})
})



module.exports = router