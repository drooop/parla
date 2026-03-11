-- English Coach: conversation persistence

CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(200),
  tag         VARCHAR(50) NOT NULL,  -- 'free-talk' | 'coffee-shop' | 'job-interview' | 'hotel-checkin'
  msg_count   INT DEFAULT 0,
  version     INT DEFAULT 0,         -- increments on each message batch write
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_tag ON conversations(tag);

CREATE TABLE messages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id      UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  seq                  INT NOT NULL,
  role                 VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content              TEXT NOT NULL,
  low_confidence_words JSONB,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conv_seq ON messages(conversation_id, seq);
