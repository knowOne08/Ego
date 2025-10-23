-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    read_time TEXT NOT NULL DEFAULT '5 min read',
    tags JSONB DEFAULT '[]'::jsonb,
    featured BOOLEAN DEFAULT false,
    image TEXT,
    slug TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- Set up RLS policies for blogs table
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to published blogs
CREATE POLICY "Public can view published blogs" ON blogs
    FOR SELECT USING (status = 'published');

-- Policy for authenticated users to manage all blogs (for admin)
CREATE POLICY "Admin can manage all blogs" ON blogs
    FOR ALL USING (auth.role() = 'authenticated');

-- Set up storage policies for blog-images bucket
CREATE POLICY "Public can view images" ON storage.objects
    FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Admin can upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can delete images" ON storage.objects
    FOR DELETE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
CREATE INDEX IF NOT EXISTS idx_blogs_date ON blogs(date DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);

-- Insert sample blog data
INSERT INTO blogs (title, excerpt, content, tags, featured, slug) VALUES 
(
    'The Philosophy of Code: Between Logic and Art',
    'Exploring the delicate balance between mathematical precision and creative expression in software development...',
    '# The Philosophy of Code: Between Logic and Art

In the realm of software development, we often find ourselves at the intersection of two seemingly opposing forces: the rigid demands of logic and the fluid nature of creative expression. This duality forms the very essence of what makes programming both a science and an art.

## The Mathematical Foundation

Every line of code we write is built upon mathematical principles. Boolean algebra governs our conditional statements, while algorithms dance to the rhythm of computational complexity. Yet within this structured framework, we find endless possibilities for creative expression.

```javascript
// Even in simple code, there''s poetry
const findMeaning = (chaos) => {
    return chaos
        .filter(thought => thought.isCoherent)
        .map(thought => thought.refine())
        .reduce((wisdom, insight) => wisdom.merge(insight), new Understanding());
};
```

## The Art of Problem Solving

Consider the moment when you''re faced with a complex problem. The solution doesn''t emerge from pure logic alone—it requires intuition, creativity, and sometimes, a leap of faith. This is where the artistry of programming reveals itself.

### Code as Poetry

Clean, elegant code has a rhythm to it. Variable names chosen with care, functions that flow naturally into one another, and architectures that tell a story. This is poetry written in semicolons and curly braces.

> "Programs must be written for people to read, and only incidentally for machines to execute." - Harold Abelson

## The Human Element

Behind every algorithm is a human mind grappling with abstract concepts, translating ideas into instructions that machines can understand. We are the poets of the digital age, crafting verses in JavaScript, sonnets in Python, and epics in C++.

When we write code, we''re not just solving problems—we''re creating languages, building worlds, and expressing ideas in ways that transcend traditional boundaries between art and science.

## The Beauty of Constraints

Paradoxically, the rigid constraints of programming languages often lead to the most creative solutions. Just as haikus force poets to distill profound thoughts into seventeen syllables, programming languages force us to express complex ideas through simple, logical constructs.

## Conclusion

The beauty of programming lies not in choosing between logic and art, but in embracing both. It''s in this synthesis that we find the true essence of software craftsmanship—where technical excellence meets creative vision. Every function we write, every architecture we design, every bug we fix is an act of creation that bridges the gap between human thought and machine execution.

*"Code is poetry that compiles."*',
    '["Philosophy", "Programming", "Art", "Technology"]'::jsonb,
    true,
    'philosophy-of-code-logic-and-art'
),
(
    'How to NOT Build a Two-Stage Model Rocket',
    'When engineering meets ambition... and occasionally, the ground. A detailed journey through our first two-stage rocket attempt, complete with failures, learnings, and explosions.',
    '# How to NOT Build a Two-Stage Model Rocket

When engineering meets ambition... and occasionally, the ground.

So... I don''t usually write blogs—mostly because I thought I wasn''t the "blogging type" (whatever that means). Actually, this is my first one. But after what happened during our first two-stage rocket attempt, I figured—yeah, it''s probably worth writing about. If nothing else, maybe someone else can laugh, learn, and avoid making the same mistakes we did.

It started off like any good launch day. The rocket was prepped, the team was hyped, someone shouted "start!" (it was me) even though the rocket was somewhere in the shot—if you squint and use your imagination.

We began the countdown with full confidence.

**3… 2… 1… LAUNCH!**

What followed was... not flight. The rocket lifted maybe a few meters off the pad, sighed like it had second thoughts, and flopped over like a fainting goat. The motor technically fired—just not enough to impress anyone, including the rocket itself.

We stood there in silence. Someone clapped. We all laughed.

This blog is a mix of that story—and all the other things that went slightly or wildly wrong—wrapped up with actual lessons about what not to do when building a two-stage model rocket.

## The Dream

Before we talk about Venessa''s (yes, it was a conscious decision to name the rocket Venessa) design, problems, and the oh-my-god-what-just-happened moments, let''s take a step back.

**Why even build a two-stage rocket in the first place?**

It''s simple—because it''s cool. But also because it''s hard. And that''s exactly what makes it worth doing. Two-stage rockets introduce a whole new layer of complexity compared to single-stage flights. You''re not just launching a rocket anymore—you''re launching a rocket that splits into two mid-air, and both halves need to do what they''re supposed to.

This complexity is exactly why we decided to build Venessa, our first two-stage rocket.

We weren''t chasing records or altitude this time. The goal was simple: **Design, build, and successfully execute a stage separation event**—the part where the upper stage cleanly detaches and continues its journey after the first stage burns out.

That''s it.

This small but critical demonstration was meant to pave the way for **Asthsiddhi**, our larger and more capable two-stage rocket that''s currently in development. Venessa was a stepping stone—an experiment, and more importantly, a learning experience.',
    '["Rocketry", "Engineering", "VGEC", "Aerospace", "Failure"]'::jsonb,
    true,
    'how-not-to-build-two-stage-rocket'
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_blogs_updated_at 
    BEFORE UPDATE ON blogs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
