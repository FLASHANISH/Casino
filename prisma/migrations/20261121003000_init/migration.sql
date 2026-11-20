-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'player',
    "dob" TEXT NOT NULL DEFAULT '',
    "kycStatus" TEXT NOT NULL DEFAULT 'pending verification - 18+ confirmed',
    "balanceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceUsdt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "verifyCode" TEXT NOT NULL DEFAULT '',
    "resetCode" TEXT NOT NULL DEFAULT '',
    "referralCode" TEXT NOT NULL DEFAULT '',
    "referredBy" INTEGER NOT NULL DEFAULT 0,
    "depositLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lossLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "favorites" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'player',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "wallet" (
    "id" SERIAL NOT NULL,
    "balanceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceUsdt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kycStatus" TEXT NOT NULL DEFAULT 'verified',
    "username" TEXT NOT NULL DEFAULT 'player',

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "game" TEXT NOT NULL,
    "betAmount" DOUBLE PRECISION NOT NULL,
    "payout" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "fairHash" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_bets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fixtureLabel" TEXT NOT NULL,
    "pick" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "stake" DOUBLE PRECISION NOT NULL,
    "potential" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "ref" TEXT NOT NULL DEFAULT '',
    "rejectReason" TEXT NOT NULL DEFAULT '',
    "destination" TEXT NOT NULL DEFAULT '',
    "screenshotRef" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games_config" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Originals',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minBet" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "maxBet" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "rtp" DOUBLE PRECISION NOT NULL DEFAULT 97,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "engine" TEXT NOT NULL DEFAULT 'slots',
    "tag" TEXT NOT NULL DEFAULT '',
    "hue" INTEGER NOT NULL DEFAULT 45,

    CONSTRAINT "games_config_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "fixtures" (
    "id" SERIAL NOT NULL,
    "team1" TEXT NOT NULL,
    "team2" TEXT NOT NULL,
    "venue" TEXT NOT NULL DEFAULT '',
    "startsAt" TEXT NOT NULL DEFAULT '',
    "odds1" DOUBLE PRECISION NOT NULL,
    "odds2" DOUBLE PRECISION NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "league" TEXT NOT NULL DEFAULT 'IPL',
    "sport" TEXT NOT NULL DEFAULT 'Cricket',

    CONSTRAINT "fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "monthlyRent" DOUBLE PRECISION NOT NULL DEFAULT 750,
    "model" TEXT NOT NULL DEFAULT 'rent',
    "status" TEXT NOT NULL DEFAULT 'active',
    "color" TEXT NOT NULL DEFAULT '#0C2B1E',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

