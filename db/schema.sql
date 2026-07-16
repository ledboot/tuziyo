-- 1. 用户表 (Users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    user_type TEXT NOT NULL DEFAULT 'free',
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
    status INTEGER NOT NULL DEFAULT 1 CHECK(status IN (1, 2)), -- 1: active, 2: deleted
    deleted_at INTEGER DEFAULT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 消息记录表 (Chat Messages)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    status INTEGER NOT NULL DEFAULT 1 CHECK(status IN (1, 2)),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt TEXT,
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

-- 4.1 消息输出表：一次生成消息可以包含多张图片
CREATE TABLE IF NOT EXISTS message_outputs (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    output_index INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'deleted')),
    image_url TEXT,
    content_type TEXT NOT NULL CHECK(content_type IN ('image', 'video', 'audio')),
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    error TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    deleted_at INTEGER,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
    UNIQUE(message_id, output_index)
);

-- 5. 订阅表 (Subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    price_id TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
    current_period_start INTEGER NOT NULL,
    current_period_end INTEGER NOT NULL,
    credit_grant_interval TEXT NOT NULL DEFAULT 'month' CHECK(credit_grant_interval IN ('month', 'year')),
    monthly_credit_amount INTEGER NOT NULL DEFAULT 0,
    last_credit_grant_at INTEGER,
    next_credit_grant_at INTEGER,
    payment_failed_at INTEGER,
    grace_period_ends_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_message_outputs_message_id ON message_outputs(message_id);
CREATE INDEX IF NOT EXISTS idx_message_outputs_status ON message_outputs(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 6. 用户 Credits 余额表
CREATE TABLE IF NOT EXISTS user_credits (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    subscription_balance INTEGER NOT NULL DEFAULT 0,
    purchased_balance INTEGER NOT NULL DEFAULT 0,
    subscription_period_start INTEGER,
    subscription_period_end INTEGER,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_used INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Credits 消耗记录表
CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK(amount != 0),
    type TEXT NOT NULL CHECK(type IN ('subscription', 'purchase', 'generation', 'refund', 'adjustment', 'onboarding')),
    description TEXT,
    model TEXT,
    credits_per_image INTEGER,
    invoice_id TEXT,
    credit_period_start INTEGER,
    credit_period_end INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_invoice_id ON credit_transactions(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_subscription_period ON credit_transactions(user_id, credit_period_start, credit_period_end) WHERE type = 'subscription' AND credit_period_start IS NOT NULL AND credit_period_end IS NOT NULL;

-- 8. 用户内容收藏表
CREATE TABLE IF NOT EXISTS content_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'image' CHECK(content_type IN ('image', 'video', 'audio')),
    message_id TEXT NOT NULL,
    output_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY(output_id) REFERENCES message_outputs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_favorites_user_id ON content_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_content_favorites_content_type ON content_favorites(content_type);
CREATE INDEX IF NOT EXISTS idx_content_favorites_message_id ON content_favorites(message_id);
CREATE INDEX IF NOT EXISTS idx_content_favorites_output_id ON content_favorites(output_id);
CREATE INDEX IF NOT EXISTS idx_content_favorites_created_at ON content_favorites(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_favorites_legacy_unique ON content_favorites(user_id, content_type, message_id) WHERE output_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_favorites_output_unique ON content_favorites(user_id, content_type, output_id) WHERE output_id IS NOT NULL;

-- 9. 异步生成任务表 (Generation Tasks)
CREATE TABLE IF NOT EXISTS generation_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    model TEXT,
    provider TEXT,
    provider_task_id TEXT,
    message_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    requested_count INTEGER NOT NULL DEFAULT 1,
    completed_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    input TEXT, -- Serialized GenerateInput JSON string
    result TEXT, -- JSON string containing output info
    error TEXT, -- Error message if failed
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_session_id ON generation_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_message_id ON generation_tasks(message_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
