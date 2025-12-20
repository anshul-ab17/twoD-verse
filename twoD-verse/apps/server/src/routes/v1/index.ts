import express, { Router } from "express";
import { adminRouter } from "./admin.js";
import { userRouter } from "./user.js";
import { spaceRouter } from "./space.js";
import { SigninSchema, SignupSchema } from "../../types/index.js";
import { prisma } from "@repo/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../../types/config.js";


export const router: Router = express.Router();

router.get('/signup', async (req, res) => {
    const parseData =SignupSchema.safeParse(req.body)
    if(!parseData.success){
        res.status(400).json({
            message:"validation failed"
        })
        return
    }
    const hashPassword= await bcrypt.hash(parseData.data.password,10)

    try{
        const user=await prisma.user.create({
            data:{
                username:parseData.data.username,
                password:hashPassword,
                role:parseData.data.type ==="admin" ?"Admin" :"User",
            }
        })
        res.json({
            userId:user.id
        })
    }
    catch(e){
        res.status(400).json({message:"user already exist"})
    }
    res.json({
        message:"signup"
    })
});

router.get('/signin',async (req,res) => {
    const parseData = SigninSchema.safeParse(req.body)
    if(!parseData.success){
        res.status(400).json({
            message:"Validation failed"
        })
        return
    }

    try{
        const user = await prisma.user.findUnique({
            where:{
                username:parseData.data.username
            }
        })
        if(!user){
            res.status(403).json({message:"user not found"})
            return
        }
        const isValid = await bcrypt.compare(parseData.data.password, user.password)
        if(!isValid){
            res.status(403).json({message:"invalid password"})
            return
        }

        const token =jwt.sign({
            userId: user.id,
            role:user.role
        },JWT_PASSWORD);

        res.json({
            token
        })

    } catch (e){
        res.status(400).json({message:"server error"})
    }
});

 

router.get('/avatars',(req,res) => {

})

router.get('/elements', (res, req) => {

})


router.get('/user',userRouter);
router.get('/admin',adminRouter);
router.get('/space',spaceRouter);
