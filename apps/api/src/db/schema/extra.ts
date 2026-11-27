import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./core";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/**
 * Password recovery without paid email: a candidate files a request, an administrator issues a one-time code
 * (shown to the admin once, stored only as a SHA-256 hash) and hands it over; the code expires after 30 minutes.
 */
export const passwordResets = sqliteTable(
  "password_resets",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
    codeHash: text(),
    status: text({ enum: ["requested", "issued", "used", "expired"] }).notNull().default("requested"),
    requestedAt: text().notNull().default(now),
    issuedAt: text(),
    issuedBy: integer().references(() => users.id, { onDelete: "set null" }),
    expiresAt: text(),
    usedAt: text(),
    attempts: integer().notNull().default(0),
  },
  (t) => [index("password_resets_user_idx").on(t.userId, t.status)],
);

export const feedback = sqliteTable(
  "feedback",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
    category: text({ enum: ["ui_ux", "technical", "exam_experience", "suggestion"] }).notNull(),
    rating: integer().notNull(),
    message: text().notNull(),
    status: text({ enum: ["new", "reviewed", "resolved"] }).notNull().default("new"),
    staffNote: text(),
    reviewedBy: integer().references(() => users.id, { onDelete: "set null" }),
    reviewedAt: text(),
    createdAt: text().notNull().default(now),
  },
  (t) => [index("feedback_user_idx").on(t.userId), index("feedback_status_idx").on(t.status)],
);

/** Previous years' papers uploaded by examiners/admins. Small files are stored inline (base64); else a link. */
export const pastPapers = sqliteTable(
  "past_papers",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uploadedBy: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text().notNull(),
    subject: text().notNull(),
    year: integer().notNull(),
    examType: text({ enum: ["midterm", "final", "quiz", "entrance", "other"] }).notNull(),
    description: text().notNull().default(""),
    fileName: text(),
    mimeType: text(),
    sizeBytes: integer(),
    content: text(),
    url: text(),
    createdAt: text().notNull().default(now),
  },
  (t) => [index("past_papers_filter_idx").on(t.subject, t.year)],
);
