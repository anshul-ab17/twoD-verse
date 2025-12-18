import {Router } from "express";


export const userRouter = Router();

userRouter.post('/metadata/',(res,req) => {
    req.json({
	"avatarId": "123",
    })
})

userRouter.get('/api/v1/metadata/bulk',() => {
})
 