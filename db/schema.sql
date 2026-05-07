-- 1. 用户表 (Users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    user_type TEXT NOT NULL DEFAULT 'free' CHECK(user_type IN ('free', 'starter', 'professional', 'enterprise')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 2. 第三方账号表 (Accounts) - 支持多种第三方登录
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK(provider IN ('google', 'github', 'apple', 'discord')),
    provider_account_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, provider_account_id)
);

-- 3. 会话表 (Chat Sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '新对话',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    preview_image TEXT DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 消息记录表 (Chat Messages)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt TEXT,
    image_url TEXT,
    aspect_ratio TEXT,
    resolution TEXT,
    enable_search INTEGER DEFAULT 0,
    google_search INTEGER DEFAULT 0,
    image_search INTEGER DEFAULT 0,
    image_size TEXT,
    quality TEXT,
    style TEXT,
    negative_prompt TEXT,
    output_format TEXT,
    num_images INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 5. 订阅表 (Subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    price_id TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK(plan IN ('starter', 'professional', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
    current_period_start INTEGER NOT NULL,
    current_period_end INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- 6. 用户 Credits 余额表
CREATE TABLE IF NOT EXISTS user_credits (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_used INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Credits 消耗记录表
CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('subscription', 'purchase', 'generation', 'refund', 'adjustment', 'onboarding')),
    description TEXT,
    model TEXT,
    credits_per_image INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
