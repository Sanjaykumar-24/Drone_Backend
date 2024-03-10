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
        StartTime:{
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
        }
     }
)
const droneModel = mongoose.model('dronedata',droneSchema)
module.exports = droneModel