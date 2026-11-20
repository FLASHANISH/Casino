ALTER TABLE `users` ADD COLUMN `referral_code` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `referred_by` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `deposit_limit` real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `loss_limit` real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `requests` ADD COLUMN `reject_reason` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `requests` ADD COLUMN `destination` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `requests` ADD COLUMN `screenshot_ref` text DEFAULT '' NOT NULL;
