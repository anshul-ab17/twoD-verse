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
        mapElements:true,
        height:true,
        width:true
    }
  })
  if(!map){
    res.status(400).json({message:"Map doesn't exist!"})
    return;
  }
  await prisma.$transaction(async () => {
       const space = await prisma.space.create({ 
            data:{
               name:parsedData.data.name,
               width:map.width,
               height:map.height,
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


spaceRouter.delete('/:spaceID',userMiddleware,async (req,res)=> {
    const space = await prisma.space.findUnique({
        where:{
            id:req.params.spaceId
        },
        select:{
            createrId:true
        }
    })
    if(!space){
        res.status(400).json({message:"space not found"})
    }
    if(space?.createrId !==req.userId){
        res.status(403).json({message:"unauthorized"})
    }

    await prisma.space.delete({
        where:{
            id:req.params.spaceId
        }
    })
    res.json({message:"space deleted."})
})
 

spaceRouter.get("/all", userMiddleware, async (req, res) => {
    const spaces = await prisma.space.findMany({
    where: {
      createrId: req.userId!,
    },
  });

  res.json({
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail,
      dimensions: `${s.width}x${s.height}`,
    })),
  });
});


// spaceRouter.post("/element", async (req, res) => {

// })


// spaceRouter.get("/:spaceId",async (req, res) => {})