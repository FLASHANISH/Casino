ALTER TABLE `users` ADD COLUMN `verify_code` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `reset_code` text DEFAULT '' NOT NULL;
