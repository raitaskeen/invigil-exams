CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`category` text NOT NULL,
	`rating` integer NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`staff_note` text,
	`reviewed_by` integer,
	`reviewed_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `feedback_user_idx` ON `feedback` (`user_id`);--> statement-breakpoint
CREATE INDEX `feedback_status_idx` ON `feedback` (`status`);--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`code_hash` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`requested_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`issued_at` text,
	`issued_by` integer,
	`expires_at` text,
	`used_at` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`issued_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `password_resets_user_idx` ON `password_resets` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `past_papers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uploaded_by` integer NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`year` integer NOT NULL,
	`exam_type` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`file_name` text,
	`mime_type` text,
	`size_bytes` integer,
	`content` text,
	`url` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `past_papers_filter_idx` ON `past_papers` (`subject`,`year`);--> statement-breakpoint
ALTER TABLE `exams` ADD `is_practice` integer DEFAULT false NOT NULL;