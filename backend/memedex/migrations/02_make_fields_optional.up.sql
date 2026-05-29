-- Make fields optional by dropping NOT NULL constraints and setting default to empty string
ALTER TABLE memedex.memes ALTER COLUMN description DROP NOT NULL;
ALTER TABLE memedex.memes ALTER COLUMN description SET DEFAULT '';

ALTER TABLE memedex.memes ALTER COLUMN context DROP NOT NULL;
ALTER TABLE memedex.memes ALTER COLUMN context SET DEFAULT '';

ALTER TABLE memedex.memes ALTER COLUMN example DROP NOT NULL;
ALTER TABLE memedex.memes ALTER COLUMN example SET DEFAULT '';
