import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enable verbose mode for debugging
sqlite3.verbose();

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = join(__dirname, '../blog.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        // Create blogs table
        const createBlogsTable = `
            CREATE TABLE IF NOT EXISTS blogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                excerpt TEXT NOT NULL,
                content TEXT NOT NULL,
                date TEXT NOT NULL,
                readTime TEXT NOT NULL,
                tags TEXT NOT NULL,
                featured BOOLEAN DEFAULT 0,
                image TEXT,
                slug TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'published',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create users table for admin authentication
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create images table for uploaded images
        const createImagesTable = `
            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                originalName TEXT NOT NULL,
                path TEXT NOT NULL,
                size INTEGER,
                mimetype TEXT,
                uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.run(createBlogsTable, (err) => {
            if (err) {
                console.error('Error creating blogs table:', err.message);
            } else {
                console.log('Blogs table created successfully');
                this.seedSampleData();
            }
        });

        this.db.run(createUsersTable, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table created successfully');
            }
        });

        this.db.run(createImagesTable, (err) => {
            if (err) {
                console.error('Error creating images table:', err.message);
            } else {
                console.log('Images table created successfully');
            }
        });
    }

    seedSampleData() {
        // Check if we already have data
        this.db.get("SELECT COUNT(*) as count FROM blogs", (err, row) => {
            if (err) {
                console.error('Error checking blog count:', err.message);
                return;
            }

            if (row.count === 0) {
                console.log('Seeding sample blog data...');
                
                const sampleBlogs = [
                    {
                        title: "The Philosophy of Code: Between Logic and Art",
                        excerpt: "Exploring the delicate balance between mathematical precision and creative expression in software development...",
                        content: `# The Philosophy of Code: Between Logic and Art

In the realm of software development, we often find ourselves at the intersection of two seemingly opposing forces: the rigid demands of logic and the fluid nature of creative expression. This duality forms the very essence of what makes programming both a science and an art.

## The Mathematical Foundation

Every line of code we write is built upon mathematical principles. Boolean algebra governs our conditional statements, while algorithms dance to the rhythm of computational complexity. Yet within this structured framework, we find endless possibilities for creative expression.

\`\`\`javascript
// Even in simple code, there's poetry
const findMeaning = (chaos) => {
    return chaos
        .filter(thought => thought.isCoherent)
        .map(thought => thought.refine())
        .reduce((wisdom, insight) => wisdom.merge(insight), new Understanding());
};
\`\`\`

## The Art of Problem Solving

Consider the moment when you're faced with a complex problem. The solution doesn't emerge from pure logic alone—it requires intuition, creativity, and sometimes, a leap of faith. This is where the artistry of programming reveals itself.

### Code as Poetry

Clean, elegant code has a rhythm to it. Variable names chosen with care, functions that flow naturally into one another, and architectures that tell a story. This is poetry written in semicolons and curly braces.

> "Programs must be written for people to read, and only incidentally for machines to execute." - Harold Abelson

## The Human Element

Behind every algorithm is a human mind grappling with abstract concepts, translating ideas into instructions that machines can understand. We are the poets of the digital age, crafting verses in JavaScript, sonnets in Python, and epics in C++.

When we write code, we're not just solving problems—we're creating languages, building worlds, and expressing ideas in ways that transcend traditional boundaries between art and science.

## The Beauty of Constraints

Paradoxically, the rigid constraints of programming languages often lead to the most creative solutions. Just as haikus force poets to distill profound thoughts into seventeen syllables, programming languages force us to express complex ideas through simple, logical constructs.

## Conclusion

The beauty of programming lies not in choosing between logic and art, but in embracing both. It's in this synthesis that we find the true essence of software craftsmanship—where technical excellence meets creative vision. Every function we write, every architecture we design, every bug we fix is an act of creation that bridges the gap between human thought and machine execution.

*"Code is poetry that compiles."*`,
                        date: "2025-01-15",
                        readTime: "8 min read",
                        tags: JSON.stringify(["Philosophy", "Programming", "Art", "Technology"]),
                        featured: 1,
                        image: "/assets/gallery/AmericanGothic.jpg",
                        slug: "philosophy-of-code-logic-and-art"
                    },
                    {
                        title: "How to NOT Build a Two-Stage Model Rocket",
                        excerpt: "When engineering meets ambition... and occasionally, the ground. A detailed journey through our first two-stage rocket attempt, complete with failures, learnings, and explosions.",
                        content: `# How to NOT Build a Two-Stage Model Rocket

When engineering meets ambition... and occasionally, the ground.

So... I don't usually write blogs—mostly because I thought I wasn't the "blogging type" (whatever that means). Actually, this is my first one. But after what happened during our first two-stage rocket attempt, I figured—yeah, it's probably worth writing about. If nothing else, maybe someone else can laugh, learn, and avoid making the same mistakes we did.

It started off like any good launch day. The rocket was prepped, the team was hyped, someone shouted "start!" (it was me) even though the rocket was somewhere in the shot—if you squint and use your imagination.

We began the countdown with full confidence.

**3… 2… 1… LAUNCH!**

What followed was... not flight. The rocket lifted maybe a few meters off the pad, sighed like it had second thoughts, and flopped over like a fainting goat. The motor technically fired—just not enough to impress anyone, including the rocket itself.

We stood there in silence. Someone clapped. We all laughed.

This blog is a mix of that story—and all the other things that went slightly or wildly wrong—wrapped up with actual lessons about what not to do when building a two-stage model rocket.

## The Dream

Before we talk about Venessa's (yes, it was a conscious decision to name the rocket Venessa) design, problems, and the oh-my-god-what-just-happened moments, let's take a step back.

**Why even build a two-stage rocket in the first place?**

It's simple—because it's cool. But also because it's hard. And that's exactly what makes it worth doing. Two-stage rockets introduce a whole new layer of complexity compared to single-stage flights. You're not just launching a rocket anymore—you're launching a rocket that splits into two mid-air, and both halves need to do what they're supposed to.

This complexity is exactly why we decided to build Venessa, our first two-stage rocket.

We weren't chasing records or altitude this time. The goal was simple: **Design, build, and successfully execute a stage separation event**—the part where the upper stage cleanly detaches and continues its journey after the first stage burns out.

That's it.

This small but critical demonstration was meant to pave the way for **Asthsiddhi**, our larger and more capable two-stage rocket that's currently in development. Venessa was a stepping stone—an experiment, and more importantly, a learning experience.

Our guiding principle from day one was: *"Do it in the simplest way that still teaches you the hard stuff."*

### Focus on Mastering Stage Separation

So instead of chasing every performance metric, we kept our sights on the core challenge—making a two-stage rocket separate mid-flight in a controlled and reliable way. Everything else—structure, propulsion, avionics—was built around that singular goal.

We knew there would be compromises. And we were okay with that. Not everything needed to be aerospace-grade. We didn't need fiberglass or carbon fiber. What we needed was something that worked just well enough to get us to the learning moment.

At every step, we asked ourselves: *"What's the easiest way we can build this and still learn the hard lesson?"*

Sometimes that meant using a cardboard cut-out part that could've been 3D printed. Sometimes it meant using a paper tube instead of an expensive composite body. Sometimes it meant letting a stage fall ballistically with no recovery system (RIP first stage, you did your job).

But that's the beauty of a learning prototype—freedom to make mistakes on purpose.

**Vanessa wasn't a rocket built for glory—it was a rocket built to teach us.**

## Conclusion

Building rockets is hard. Building two-stage rockets is harder. But that's exactly what makes it worth doing.

Venessa didn't achieve her flight goals, but she achieved something more important—she taught us. Every failure, every miscalculation, every moment of "oh no, that's not supposed to happen" contributed to our understanding of what it takes to build reliable, complex rocket systems.

In rocketry, as in life, failure isn't the opposite of success—it's a stepping stone to it.

**Next time: More thrust, better fuel, and hopefully, actual flight.**

*Stay tuned for the Asthsiddhi story—where we hopefully get it right.*

---

*Want to learn more about our rocketry adventures? Follow our journey at VGEC Rocketry Club.*`,
                        date: "2024-11-15",
                        readTime: "12 min read",
                        tags: JSON.stringify(["Rocketry", "Engineering", "VGEC", "Aerospace", "Failure"]),
                        featured: 1,
                        image: "/assets/gallery/TheVanGogh.jpg",
                        slug: "how-not-to-build-two-stage-rocket"
                    }
                ];

                const insertQuery = `
                    INSERT INTO blogs (title, excerpt, content, date, readTime, tags, featured, image, slug)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                sampleBlogs.forEach(blog => {
                    this.db.run(insertQuery, [
                        blog.title,
                        blog.excerpt,
                        blog.content,
                        blog.date,
                        blog.readTime,
                        blog.tags,
                        blog.featured,
                        blog.image,
                        blog.slug
                    ], (err) => {
                        if (err) {
                            console.error('Error inserting sample blog:', err.message);
                        }
                    });
                });

                console.log('Sample blog data seeded successfully');
            }
        });
    }

    // Blog operations
    getAllBlogs(callback) {
        const query = `
            SELECT id, title, excerpt, date, readTime, tags, featured, image, slug, status
            FROM blogs 
            WHERE status = 'published'
            ORDER BY date DESC
        `;
        this.db.all(query, callback);
    }

    getBlogById(id, callback) {
        const query = `
            SELECT * FROM blogs 
            WHERE id = ? AND status = 'published'
        `;
        this.db.get(query, [id], callback);
    }

    getBlogBySlug(slug, callback) {
        const query = `
            SELECT * FROM blogs 
            WHERE slug = ? AND status = 'published'
        `;
        this.db.get(query, [slug], callback);
    }

    createBlog(blogData, callback) {
        const query = `
            INSERT INTO blogs (title, excerpt, content, date, readTime, tags, featured, image, slug, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        this.db.run(query, [
            blogData.title,
            blogData.excerpt,
            blogData.content,
            blogData.date,
            blogData.readTime,
            JSON.stringify(blogData.tags),
            blogData.featured ? 1 : 0,
            blogData.image,
            blogData.slug,
            blogData.status || 'published'
        ], callback);
    }

    updateBlog(id, blogData, callback) {
        const query = `
            UPDATE blogs 
            SET title = ?, excerpt = ?, content = ?, readTime = ?, tags = ?, featured = ?, image = ?, slug = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        this.db.run(query, [
            blogData.title,
            blogData.excerpt,
            blogData.content,
            blogData.readTime,
            JSON.stringify(blogData.tags),
            blogData.featured ? 1 : 0,
            blogData.image,
            blogData.slug,
            id
        ], callback);
    }

    deleteBlog(id, callback) {
        const query = `DELETE FROM blogs WHERE id = ?`;
        this.db.run(query, [id], callback);
    }

    // Image operations
    saveImage(imageData, callback) {
        const query = `
            INSERT INTO images (filename, originalName, path, size, mimetype)
            VALUES (?, ?, ?, ?, ?)
        `;
        this.db.run(query, [
            imageData.filename,
            imageData.originalName,
            imageData.path,
            imageData.size,
            imageData.mimetype
        ], callback);
    }

    getAllImages(callback) {
        const query = `SELECT * FROM images ORDER BY uploadedAt DESC`;
        this.db.all(query, callback);
    }
}

export default new Database();
