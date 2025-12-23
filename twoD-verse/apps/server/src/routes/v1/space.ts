import express, { Router } from "express";
import { userMiddleware } from "../../middleware/user.js";
import { AddElementSchema, CreateSpaceSchema, DeleteElementScheme } from "../../types/index.js";
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
        creatorId: req.userId!,
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
               creatorId:req.userId!,
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


spaceRouter.delete('/:spaceId',userMiddleware,async (req,res)=> {
    const space = await prisma.space.findUnique({
        where:{
            id:req.params.spaceId
        },
        select:{
            creatorId:true
        }
    })
    if(!space){
        res.status(400).json({message:"space not found"})
    }
    if(space?.creatorId !==req.userId){
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
            creatorId: req.userId!,
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


spaceRouter.post("/element",userMiddleware, async (req, res) => {
    const parseData = AddElementSchema.safeParse(req.body)
    if(!parseData.success){
        res.status(400).json({message:"valdiation failed"})
        return
    }
    const space = await prisma.space.findUnique({
        where:{
            id:req.body.spaceId,
            creatorId:req.userId
        },
        select:{
            id:req.body.spaceId,
            width:true,
            height:true
        }
    })
    if(!space){
        res.status(400).json({message:"space not found"})
        return
    }

    await prisma.spaceElements.create({
        data:{
            spaceId:req.body.spaceId,            
            elementId:req.body.elementId,            
            x:req.body.x,
            y:req.body.y           
        }
    })
    res.json({message:"element added"})
})

spaceRouter.delete("/element",userMiddleware, async (req, res) => {
    const parsedData= DeleteElementScheme.safeParse(req.body)
    if(!parsedData.success){
        res.status(400).json({message:"validation error"})
        return 
    }

    const spaceElement= await prisma.spaceElements.findFirst({
        where:{
            id:parsedData.data.id
        }, include:{
            Space:true
        }
    })
    if(!spaceElement?.Space.creatorId || spaceElement.Space.creatorId !==  req.userId) {
        res.status(403).json({message:"unauthorized"})
    }
    await prisma.spaceElements.delete({
        where:{
            id:parsedData.data.id
        }
    })
    res.json({message: "element deleted"})
})


spaceRouter.get("/:spaceId",async (req, res) => {
    const space = await prisma.space.findUnique({
        where: {
            id: req.params.spaceId
        },
        include: {
            elements: {
                include: {
                    element: true
                }
            },
        }
    })

    if (!space) {
        res.status(400).json({message: "Space not found"})
        return
    }

    res.json({
        "dimensions": `${space.width}x${space.height}`,
        elements: space.elements.map((e )=> ({
            id: e.id,
            element: {
                id: e.element.id,
                imageUrl: e.element.imageUrl,
                width: e.element.width,
                height: e.element.height,
                static: e.element.static
            },
            x: e.x,
            y: e.y
        })),
    })
})