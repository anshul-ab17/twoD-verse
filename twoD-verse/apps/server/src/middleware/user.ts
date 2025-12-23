import { jwt } from "zod";
import { JWT_PASSWORD } from "../types/config.js";

export const adminMiddleware = (req,res,next) =>{
    const header = req.header.authorization
    const token =  header.split(" ")[1];

    if(!token){
        res.status(401).json({message:"unauthorized"})
        return
    }


    try{
        const decode = jwt.verify(token, JWT_PASSWORD)
        if(!decode.role !== "Admin"){
            res.status(401).json({message:"unauthorized"})
            return
        }
    }
}