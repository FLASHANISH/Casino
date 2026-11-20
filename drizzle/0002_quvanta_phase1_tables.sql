DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE wallet (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  balance_usd REAL NOT NULL DEFAULT 0,
  balance_usdt REAL NOT NULL DEFAULT 0,
  kyc_status TEXT NOT NULL DEFAULT 'verified',
  username TEXT NOT NULL DEFAULT 'player'
);
--> statement-breakpoint
CREATE TABLE ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  bet_amount REAL NOT NULL,
  payout REAL NOT NULL,
  profit REAL NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  fair_hash TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE games_config (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Originals',
  enabled INTEGER NOT NULL DEFAULT 1,
  min_bet REAL NOT NULL DEFAULT 1,
  max_bet REAL NOT NULL DEFAULT 500,
  rtp REAL NOT NULL DEFAULT 97,
  plays INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  commission REAL NOT NULL DEFAULT 15,
  monthly_rent REAL NOT NULL DEFAULT 750,
  model TEXT NOT NULL DEFAULT 'rent',
  status TEXT NOT NULL DEFAULT 'active',
  color TEXT NOT NULL DEFAULT '#0C2B1E',
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE fixtures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  venue TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL DEFAULT '',
  odds1 REAL NOT NULL,
  odds2 REAL NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE sports_bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fixture_label TEXT NOT NULL,
  pick TEXT NOT NULL,
  odds REAL NOT NULL,
  stake REAL NOT NULL,
  potential REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL
);
