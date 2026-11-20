ALTER TABLE games_config ADD COLUMN description TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE games_config ADD COLUMN engine TEXT NOT NULL DEFAULT 'slots';
--> statement-breakpoint
ALTER TABLE games_config ADD COLUMN tag TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE games_config ADD COLUMN hue INTEGER NOT NULL DEFAULT 45;
--> statement-breakpoint
ALTER TABLE fixtures ADD COLUMN league TEXT NOT NULL DEFAULT 'IPL';
--> statement-breakpoint
ALTER TABLE fixtures ADD COLUMN sport TEXT NOT NULL DEFAULT 'Cricket';
--> statement-breakpoint
ALTER TABLE users ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN last_bonus TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE users ADD COLUMN favorites TEXT NOT NULL DEFAULT '';
