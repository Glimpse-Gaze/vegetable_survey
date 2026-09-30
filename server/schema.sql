CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  public_display boolean NOT NULL DEFAULT false,
  developer_message text,
  ranking_code text
);

CREATE UNIQUE INDEX IF NOT EXISTS responses_ranking_code_idx
  ON responses (ranking_code)
  WHERE ranking_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS responses_created_at_idx ON responses (created_at DESC);
CREATE INDEX IF NOT EXISTS responses_public_display_idx ON responses (public_display)
  WHERE public_display = true;

CREATE TABLE IF NOT EXISTS custom_reason_votes (
  comment_id text NOT NULL,
  visitor_id uuid NOT NULL,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, visitor_id)
);
