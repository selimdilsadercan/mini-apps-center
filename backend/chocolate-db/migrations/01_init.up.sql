CREATE TABLE chocolates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chocolate_id UUID REFERENCES chocolates(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
