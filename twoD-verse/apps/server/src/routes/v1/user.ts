import express, { Router } from "express"; 
import {UpdateMetadataSchema} from "../../types/index.js";
import { prisma } from "@repo/db"; 
import {userMiddleware} from "../../middleware/user.js"

export const userRouter: Router = express.Router();


userRouter.post('/metadata/', userMiddleware, async(req, res) => {
    const parseData = UpdateMetadataSchema.safeParse(req.body);

    if(!parseData.success) {  
        res.status(400).json({message: "Validation failed"});
        return;
    }
    
    if(!req.userId) { 
        res.status(401).json({message: "Unauthorized"});
        return;
    }
    
    await prisma.user.update({
        where: {
            id: req.userId  
        },
        data: {
            avatarId: parseData.data.avatarId 
        }
    });
    
    res.status(200).json({message: "Metadata updated successfully"});
});


userRouter.get('/metadata/bulk',async(req,res) => {
    
    const userIdString = (req.query.ids?? "[]") as string;
    const userIds =(userIdString).slice(1,userIdString?.length-2).split(",");

    const metadata = await prisma.user.findMany({
        where:{
            id:{
                in:userIds
            }
        },select: {
            avatar:true,
            id:true
        }
    })

    res.json({
        avatars: metadata.map( m => ({
            userId:m.id,
            avatarId: m.avatar?.imageUrl
        }))
    })

})
 