import Router from "express"
import { adminRouter } from "./admin";
import { userRouter } from "./user";
import { spaceRouter } from "./space";

export const router = Router();

router.get('/signup', (req, res) => {
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
