const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
require('dotenv').config()
const loginModel = require('../schemas/logindb')
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
module.exports = router