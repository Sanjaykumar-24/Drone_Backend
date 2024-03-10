const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username: String,
    password:String
})
const loginModel = mongoose.model('admins',userSchema);
module.exports = loginModel;