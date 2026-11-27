import { z } from "zod";
import { emailSchema, passwordSchema } from "./auth";

// ---- Password recovery (no paid email: an administrator issues a one-time code) ------------------------------
export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{8}$/, "The reset code has 8 letters and numbers"),
    password: passwordSchema,
    confirm: z.string().min(1, "Repeat the new password"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---- Feedback hub ----------------------------------------------------------------------------------------------
export const FEEDBACK_CATEGORIES = [
  { value: "ui_ux", label: "UI / UX" },
  { value: "technical", label: "Technical issue" },
  { value: "exam_experience", label: "Exam experience" },
  { value: "suggestion", label: "Suggestion" },
] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];

export const feedbackSchema = z.object({
  category: z.enum(["ui_ux", "technical", "exam_experience", "suggestion"], { error: "Choose a category" }),
  rating: z.coerce.number().int().min(1, "Give a rating from 1 to 5").max(5, "Give a rating from 1 to 5"),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000, "Keep it under 2000 characters"),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const feedbackReviewSchema = z.object({
  status: z.enum(["new", "reviewed", "resolved"]),
  staffNote: z.string().trim().max(1000).optional().nullable(),
});

// ---- Past papers -----------------------------------------------------------------------------------------------
export const PAPER_TYPES = ["midterm", "final", "quiz", "entrance", "other"] as const;
/** Inline files must fit D1 rows and the 1 MB request limit once base64-encoded. */
export const MAX_PAPER_BYTES = 600 * 1024;

export const pastPaperSchema = z
  .object({
    title: z.string().trim().min(3, "Give the paper a title").max(140),
    subject: z.string().trim().min(2, "Enter the subject").max(80),
    year: z.coerce.number().int().min(1990, "Year looks too early").max(2100, "Year looks too late"),
    examType: z.enum(PAPER_TYPES),
    description: z.string().trim().max(1000).default(""),
    url: z.url("Enter a full link (https://...)").max(500).optional().nullable(),
    file: z
      .object({
        name: z.string().trim().min(1).max(160),
        mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "text/plain"], { error: "Upload a PDF, PNG, JPEG or text file" }),
        base64: z.string().min(4).max(Math.ceil((MAX_PAPER_BYTES * 4) / 3) + 8, "File is larger than 600 KB"),
      })
      .optional()
      .nullable(),
  })
  .refine((v) => !!v.url || !!v.file, { path: ["file"], message: "Attach a file or give a link" });
export type PastPaperInput = z.infer<typeof pastPaperSchema>;
