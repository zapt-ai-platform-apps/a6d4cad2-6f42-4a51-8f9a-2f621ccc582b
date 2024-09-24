import { books, goals } from '../drizzle/schema.js';
import { authenticateUser } from "./_apiUtils.js";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const user = await authenticateUser(req);
    const sql = neon(process.env.NEON_DB_URL);
    const db = drizzle(sql);

    const currentYear = new Date().getFullYear();

    // Fetch reading goal
    const goalResult = await db.select().from(goals)
      .where(and(eq(goals.year, currentYear), eq(goals.userId, user.id)));

    const goal = goalResult.length > 0 ? goalResult[0].target : null;

    // Fetch books read
    const booksResult = await db.select()
      .from(books)
      .fields({
        totalBooks: db.raw('COUNT(*)'),
        averageRating: db.raw('AVG(rating)'),
      })
      .where(and(eq(books.userId, user.id), eq(books.status, 'Read')));

    const totalBooks = parseInt(booksResult[0].totalBooks, 10) || 0;
    const averageRating = parseFloat(booksResult[0].averageRating) || 0;

    res.status(200).json({
      goal,
      totalBooks,
      averageRating,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    if (error.message.includes('Authorization') || error.message.includes('token')) {
      res.status(401).json({ error: 'Authentication failed' });
    } else {
      res.status(500).json({ error: 'Error fetching stats' });
    }
  }
}