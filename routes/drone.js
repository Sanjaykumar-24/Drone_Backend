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
})

function addTimeStrings(time1, time2) {
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
}


///////////////////////////////////////////////////////////////////////////


router.get('/rpaslog', verify, async(req, res) => {
    try {
        const data = await droneModel.find().exec();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('RPAS LOGBOOK');

        // Set column widths
        worksheet.columns = [
            { header: 'Date', key: 'Date', width: 15 },
            { header: 'Name of RPIC', key: 'Trainer', width: 20 },
            { header: 'Place of Operation', key: 'Place', width: 25 },
            { header: 'StartTime(UTC)', key: 'StartTime', width: 18 },
            { header: 'EndTime(UTC)', key: 'EndTime', width: 18 },
            { header: 'Duration(HH:MM)', key: 'Duration', width: 18 },
            { header: 'CumDuration(HH:MM)', key: 'CumDuration', width: 20 },
        ];

        // Add data rows
        data.forEach(item => {

            worksheet.addRow([item.Date, item.Trainer, item.Place, item.StartTime, item.EndTime, item.Duration, item.CumDuration]);
        });

        const filePath = path.join(__dirname, '..', 'temp', 'rpaslog_drone_data.xlsx');

        // Write the workbook to a temporary file
        await workbook.xlsx.writeFile(filePath);

        // Send the file as a download attachment
        res.download(filePath, 'rpaslog_drone_data.xlsx', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error sending file');
            }

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting temporary file:', err);
                }
            });
        });
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error generating Excel');    
    }
});



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get('/authlog',verify, async(req, res) => {
    try {
        const data = await droneModel.find().exec();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('FLIGHT AUTHORIZATION LOGBOOK');

        // Set column widths
        worksheet.columns = [
            { header: 'Date', key: 'Date', width: 15 },
            { header: 'UNI', key: 'UNI', width: 15 },
            { header: 'Name of RPIC', key: 'Trainer', width: 20 },
            { header: 'Name of Trainee', key: 'Trainee', width: 20 },
            { header: 'Exercise', key: 'Exercise', width: 15 },
            { header: 'Duration(HH:MM)', key: 'Duration', width: 18 },
        ];

        // Add data rows
        data.forEach(item => {
            worksheet.addRow([item.Date, item.UNI, item.Trainer, item.Trainee, item.Exercise, item.Duration]);
        });

        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.setHeader('Content-Disposition', 'attachment; filename="drone_data.xlsx"');

        const filePath = path.join(__dirname, '..', 'temp', 'Auth_drone_data.xlsx');

        // Write the workbook to a temporary file
        await workbook.xlsx.writeFile(filePath);

        // Send the file as a download attachment
        res.download(filePath, 'Auth_drone_data.xlsx', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error sending file');
            }

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting temporary file:', err);
                }
            });
        });
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error generating Excel');    
    }
});


module.exports = router