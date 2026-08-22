import { z } from 'zod';

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  subject: z.string()
    .trim()
    .max(200, "Subject must be less than 200 characters")
    .optional(),
  message: z.string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters")
});

// Post creation validation schema
export const postSchema = z.object({
  text: z.string()
    .trim()
    .max(500, "Post text must be less than 500 characters")
    .optional(),
  media_urls: z.array(z.string().url()).optional()
}).refine(
  data => data.text || (data.media_urls && data.media_urls.length > 0),
  { message: "Post must have either text or media" }
);

// Auth validation schemas
export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters"),
  firstName: z.string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: z.string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  phone: z.string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
    { message: "Please enter a valid phone number" }
  )
});

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type PostData = z.infer<typeof postSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
