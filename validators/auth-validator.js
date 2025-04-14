import z from "zod";

export const LoginUserSchema= z.object({
    email:z
    .string()
    .trim()
    .email({message:"Please enter valid email address"})
    .max(100,{message:"Email must be no more than 100 characters."}),

    password:z
    .string()
    .min(6,{message:"Password must at least 6 characters long."})
    .max(50,{message:"Password must be no more than 50 characters."})
})

export const registerUserSchema= LoginUserSchema.extend({
    name: z
    .string()
    .trim()
    .min(3,{message:"Name must be at least 3 characters long."})
    .max(100,{message:"Name must be no more than 100 characters."}),
})

