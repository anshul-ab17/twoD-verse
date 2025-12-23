import express, { Router } from "express";
import { userMiddleware } from "../../middleware/user.js";
import { CreateSpaceSchema } from "../../types/index.js";
import { prisma } from "@repo/db"; 
export const spaceRouter: Router = express.Router();


spaceRouter.post('/', userMiddleware, async (req, res) => {
  const parsedData = CreateSpaceSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "validation failed" });
    return;
  }

  const [widthStr, heightStr] = parsedData.data.dimensions.split("x");

  const width = Number(widthStr);
  const height = Number(heightStr);


  if (!parsedData.data.mapId) {
    const space = await prisma.space.create({
      data: {
        name: parsedData.data.name,
        width,
        height,
        createrId: req.userId!,
      },
    });

    res.json({spaceId: space.id });
    return;
  }
  const map = await prisma.map.findUnique({
    where:{
        id:parsedData.data.mapId
    },select:{
        mapElements:true
    }
  })
  if(!map){
    res.status(400).json({message:"Map doesn't exist!"})
  }
  await prisma.$transaction(async () => {
       const space = await prisma.space.create({ 
            data:{
               name:parsedData.data.name,
               width,
               height,
               createrId:req.userId!,
            },
        });
      if(map?.mapElements && map.mapElements.length > 0) {
        await prisma.spaceElements.createMany({
            data:map?.mapElements.map(e => ({
                spaceId: space.id,
                elementId:e.elementId,
                x:e.x!,
                y:e.y!
            }))
        })
        return space;
        }
        res.json({spaceId:space.id})
   });
});

// spaceRouter.delete('/element',(req,res)=> {

// })
// spaceRouter.delete('/:spaceID',(req,res)=> {

// })
 
// spaceRouter.get('/all',(req,res)=> {

// })

// spaceRouter.post("/element", async (req, res) => {

// })


// spaceRouter.get("/:spaceId",async (req, res) => {})