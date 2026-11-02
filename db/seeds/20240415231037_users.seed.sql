-- migrate:up
-- Not the email of the Swagger example, so "Try it out" on POST /users does not get a 409
INSERT INTO
  users (
    id,
    "createdAt",
    "updatedAt",
    email,
    country,
    "postalCode",
    street,
    "role"
  )
VALUES
  (
    'f59d0748-d455-4465-b0a8-8d8260b1c877',
    now(),
    now(),
    'jane@example.com',
    'England',
    '24312',
    'Road Avenue',
    'guest'
  )
ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM users WHERE id='f59d0748-d455-4465-b0a8-8d8260b1c877'
