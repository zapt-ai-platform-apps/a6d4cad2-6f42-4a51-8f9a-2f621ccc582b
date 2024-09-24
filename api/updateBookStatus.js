import { books } from '../drizzle/schema.js';
import { authenticateUser } from "./_apiUtils.js";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const user = await authenticateUser(req);
    const { id, status, rating, review } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Book ID and status are required' });
    }

    const sql = neon(process.env.NEON_DB_URL);
    const db = drizzle(sql);

    const updateData = { status };
    if (rating !== undefined) updateData.rating = rating;
    if (review !== undefined) updateData.review = review;

    await db.update(books)
      .set(updateData)
      .where(eq(books.id, id), eq(books.userId, user.id));

    res.status(200).json({ message: 'Book updated successfully' });
  } catch (error) {
    console.error('Error updating book:', error);
    if (error.message.includes('Authorization') || error.message.includes('token')) {
      res.status(401).json({ error: 'Authentication failed' });
    } else {
      res.status(500).json({ error: 'Error updating book' });
    }
  }
}