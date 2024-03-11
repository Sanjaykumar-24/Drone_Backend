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
     const all = await droneModel.find();
    let n = all.length;
    let cumulativeDuration;
    if (n === 0) {
        cumulativeDuration = duration; // Set cumulative duration to current duration if no previous entries
    } else {
        const previousCumulativeDuration = all[n - 1].CumDuration;
        cumulativeDuration = addTimeStrings(previousCumulativeDuration, duration);
    }

    data.CumDuration = cumulativeDuration;

     const info = await droneModel.create(data)
     info.save()
     if(!info)
     {
        return res.json({message:'failed',error:'failed to add data'})
     }
     return res.json({message:'success'})
})

function addTimeStrings(time1, time2) {
    const [hours1, rawMinutes1] = time1.split('h:');
    const [hours2, rawMinutes2] = time2.split('h:');

    const minutes1 = parseInt(rawMinutes1.replace('m', ''), 10);
    const minutes2 = parseInt(rawMinutes2.replace('m', ''), 10);

    const parsedHours1 = parseInt(hours1, 10);
    const parsedHours2 = parseInt(hours2, 10);

    let totalHours = parsedHours1 + parsedHours2;
    let totalMinutes = minutes1 + minutes2;

   
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes %= 60;

    let finalHours = totalHours % 24;
    let finalDays = Math.floor(totalHours / 24);

    
    let result = '';
    if (finalDays > 0) {
        result += finalDays + 'd:';
    }
    result += finalHours + 'h:' + totalMinutes + 'm';

    return result;
}
///////////////////////////////////////////////////////////////////////////






module.exports = router