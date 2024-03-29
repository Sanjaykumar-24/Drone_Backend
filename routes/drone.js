const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone')
const ExcelJS = require('exceljs');
const path = require('path')
const fs = require('fs')
require('dotenv').config()
const loginModel = require('../schemas/logindb');
const droneModel = require('../schemas/dronedb');
router.post('/login', async(req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.json({ message: "all feilds required" })
        }
        const user = await loginModel.findOne({ username: username });
        if (!user) {
            return res.json({ message: "failed", error: "admin not found" });
        }
        if (user.password != password) {
            return res.json({ message: "failed", error: "wrong password" });
        }
        const token = jwt.sign({ id: user.id },
            process.env.SECRET_KEY, {
                expiresIn: '20d'
            })
        return res.status(200).json({ message: "login successfull", token: token });
        
    } catch (error) {
        res.json({message:"failed",error:error.message})
        
    }
})


////////////////////////////////////////////////////////////////////////////////////////////////


const verify = async(req, res, next) => {
    const token = req.headers?.authorization?.split(" ")[1];
    if (!token) {
        return res.json({ message: 'failed', error: 'token not found' })
    }
    jwt.verify(
        token,
        process.env.SECRET_KEY,
        async(err, user) => {
            if (err) {
                return res.json({ message: 'failed', error: err.message })
            }
            const data = await loginModel.findById(user.id)
            if (!data) {
                return res.json({ message: 'failed', error: 'invaild user' })
            }
            req.userId = user.id
            next()
        }
    )
}
router.post('/data', verify, async(req, res) => {
    try {
        const data = req.body
        const userId = req.userId
        const [hours1, rawMinutes1] = data.StartTime.split(':');
        const [hours2, rawMinutes2] = data.EndTime.split(':');
        const minutes1 = parseInt(rawMinutes1, 10);
        const minutes2 = parseInt(rawMinutes2, 10);
        const Hours1 = parseInt(hours1, 10);
        const Hours2 = parseInt(hours2, 10);
        const totalMinutes1 = Hours1 * 60 + minutes1;
        const totalMinutes2 = Hours2 * 60 + minutes2;
    
        const durationInMinutes = totalMinutes2 - totalMinutes1;
    
        const hours = Math.floor(durationInMinutes / 60);
        const minutes = durationInMinutes % 60;
        const duration = hours + 'h:' + minutes + 'm';
        const user = await loginModel.findById(userId)
        data.Duration = duration
        data.Trainer = user.username
        let cumulativeDuration;
        const previousCumulativeDuration = await droneModel.find();
        let n = previousCumulativeDuration.length;
        if (n === 0) {
            cumulativeDuration = duration; // Set cumulative duration to current duration if no previous entries
        } else {
            console.log(previousCumulativeDuration[n - 1].CumDuration)
            cumulativeDuration = addTimeStrings(previousCumulativeDuration[n - 1].CumDuration, duration);
        }
    
        data.CumDuration = cumulativeDuration;
    
        const info = await droneModel.create(data)
        info.save()
        if (!info) {
            return res.json({ message: 'failed', error: 'failed to add data' })
        }
        return res.json({ message: 'success' })
        
    } catch (error) {
        res.json({message:"failed",error:error.message});
    }
})

function addTimeStrings(time1, time2) {
    try {
        
        const [hours1, rawMinutes1] = time1.split(':');
        const [hours2, rawMinutes2] = time2.split(':');
    
        const minutes1 = parseInt(rawMinutes1, 10);
        const minutes2 = parseInt(rawMinutes2, 10);
    
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
    } catch (error) {
        console.log(error);
    }
}


///////////////////////////////////////////////////////////////////////////


router.get('/rpaslog',verify, async(req, res) => {
    try {
        const data = await droneModel.find();
        res.json({message:"success",data});
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error generating Excel');    
    }
});



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get('/authlog',verify, async(req, res) => {
    try {
        const data = await droneModel.find().exec();

        res.json({message:"success",data});
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error generating Excel');    
    }
});


module.exports = router