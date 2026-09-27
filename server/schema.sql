CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  public_display boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS responses_created_at_idx ON responses (created_at DESC);
CREATE INDEX IF NOT EXISTS responses_public_display_idx ON responses (public_display)
  WHERE public_display = true;
