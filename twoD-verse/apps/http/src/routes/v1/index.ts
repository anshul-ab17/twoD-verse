import Router from "express"
import { adminRouter } from "./admin";
import { userRouter } from "./user";
import { spaceRouter } from "./space";
import { SignupSchema } from "../../types/index";
import client from "@repo/db/client";

export const router = Router();

router.get('/signup', (req, res) => {
    const parseData =SignupSchema.safeParse(req.body)
    if(!parseData.success){
        res.status(400).json({
            message:"validation failed"
        })
        return
    }

    try{
        client.user.create({
            data:{
                username:parseData.data.username,
                password:parseData.data.password,
                role:parseData.data.type ==="admin" ?"Admin" :"User",
            }
        })
    }
    catch(e){
        res.status(400).json({message:"server error"})
    }
    res.json({
        message:"signup"
    })
});

router.get('/signin', (req,res) => {
    res.json({
        mes:"singin"
    })
});

 

router.get('/avatars',(req,res) => {

})

router.get('/elements', (res, req) => {

})


router.get('/user',userRouter);
router.get('/admin',adminRouter);
router.get('/space',spaceRouter);
