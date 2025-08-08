import { z } from "zod"

export const registerSchema = z.object({
    message: z.string().min(2, 'Message must be at least 2 characters'),
    recipient: z.string().min(2, 'Recipient handle must be at least 2 characters'),
    telegram: z.string().optional()
  })
  
export type RegisterFormData = z.infer<typeof registerSchema>    