const mongoose = require('mongoose')
const droneSchema = new mongoose.Schema(
     {
        UNI:{
            type:String
        },
        Trainer:{
           type:String
        },
        Trainee:{
            type:String
        },
        Exercise:{
            type:String
        },
        Date:{
            type:String
        },
        StartTime:{
            type:String
        },
        Place:{
             type:String
        },
        EndTime:{
            type:String
        },
        Duration:{
            type:String
        },
        CumDuration:{
            type:String
        },
        landings:{
            type:String
        },
        BatteryNo:{
            type:String
        }
     }
)
const droneModel = mongoose.model('dronedata',droneSchema)
module.exports = droneModel