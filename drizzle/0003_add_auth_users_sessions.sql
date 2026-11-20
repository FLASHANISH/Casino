CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'player',
  dob TEXT NOT NULL DEFAULT '',
  kyc_status TEXT NOT NULL DEFAULT 'verified — 18+',
  balance_usd REAL NOT NULL DEFAULT 0,
  balance_usdt REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX users_email_unique ON users (email);
--> statement-breakpoint
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
ALTER TABLE bets ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE ledger ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE requests ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE sports_bets ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0;
