import express, { Router } from "express"; 
import {UpdateMetadataSchema} from "../../types/index.js";
import { prisma } from "@repo/db"; 


export const userRouter: Router = express.Router();


userRouter.post('/metadata/',(req,res) => {
    const parseData= UpdateMetadataSchema.safeParse(req.body)

    if(!parseData){
        res.status(400).json({message:"Validation failed"})
        return
    }
})
// prisma.user.update({
//     where: {
//         id:
//     },
//     data: undefined
// })

userRouter.get('/metadata/bulk',() => {
})
 