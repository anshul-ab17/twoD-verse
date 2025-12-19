import { z, email } from "zod"; 

export const SignupSchema =z.object({
    email:z.email(),
    password:z.string().min(8),
    type:z.enum(["user","admin"])
})

export const SigninSchema =z.object({
    email:z.email(),
    password:z.string().min(8), 
})

export const UpdateMetadataSchema =z.object({
    avatarId:z.string()
})
 
export const CreateSpaceSchema = z.object({
    name:z.string(),
    dimensions:z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
    mapId:z.string()
})

export const AddElementSchema= z.object({
    spaceId:z.string(),
    elementId:z.string(),
    x:z.number(),
    y:z.number()
})

export const CreateElementSchema = z.object({
    imageUrl:z.string(),
    width:z.number(),
    height:z.number(),
    static:z.boolean(),
})

export const UpdateElementSchemaa = z.object({
    imageUrl:z.string()
})

export const CreateAvatarSchema = z.object({
    thumbnail:z.string (),
    dimenesions:z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}/),
    defaultElement:z.array(z.object({
        elementId:z.string(),
        x:z.number(),
        y:z.number()
    }))
})