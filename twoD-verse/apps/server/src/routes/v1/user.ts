import express, { Router } from "express";

export const userRouter: Router = express.Router();


userRouter.post('/metadata/',(res,req) => {
    req.json({
	"avatarId": "123",
    })
})

userRouter.get('/api/v1/metadata/bulk',() => {
})
 