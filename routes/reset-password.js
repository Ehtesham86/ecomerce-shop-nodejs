const router = require("express").Router();
// const { User } = require("../models/user");
const token = require("../models/token");
const bcryptSalt = process.env.BCRYPT_SALT;
const crypto = require("crypto");
// const salt=require('salt')
// const sendEmail = require("../utils/sendEmail");
// const mongoose =require("mongoose");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const bcrypt = require("bcryptjs");
const mongoose=require('mongoose')
const { User, validate } = require("../models/users");
const express = require("express");
const Token = require("../models/token");
// const sendEmail = require("../utils/sendEmail");
const sendEmail = require("../utils/sendEmail");
router.post("/", async (req, res) => {
    try {
        const schema = Joi.object({ email: Joi.string().email().required() });
        const { error } = schema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const user = await User.findOne({ email: req.body.email });
        if (!user)
            return res.status(400).send("user with given email doesn't exist");

        let token = await Token.findOne({ userId: user._id });
        if (!token) {
            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
            }).save();
        }

        const link = `${process.env.BASE_URL}/reset-password/${user._id}/${token.token}`;
        await sendEmail(user.email, "Password reset", link);

        res.send("password reset link sent to your email account");
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});

router.post("/:userId/:token", async (req, res) => {
  try {
    const schema = Joi.object({ password: Joi.string().required() });
    
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).json({message:"invalid link or expired"});

   

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).json({message:"Invalid link or expired"
  });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    // user.password = req.body.password; only


    // const salt = await bcrypt.gentSalt(10);
    // const hashPassword = await bcrypt.hash(user.password, bcryptSalt);
    await user.save();
    await token.delete();

    res.status(200).json({message:"password reset sucessfully",
  });
  } catch (error) {
    res.json({message:"An error occured"});
    console.log(error);
  }
});


module.exports = router;




