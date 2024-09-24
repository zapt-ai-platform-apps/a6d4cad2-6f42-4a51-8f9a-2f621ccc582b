import { goals } from '../drizzle/schema.js';
import { authenticateUser } from "./_apiUtils.js";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    res.setHeader('Allow', ['POST', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const user = await authenticateUser(req);
    const { year, target } = req.body;

    if (!year || !target) {
      return res.status(400).json({ error: 'Year and target are required' });
    }

    const sql = neon(process.env.NEON_DB_URL);
    const db = drizzle(sql);

    const existingGoal = await db.select().from(goals)
      .where(and(eq(goals.year, year), eq(goals.userId, user.id)))
      .limit(1);

    if (existingGoal.length > 0) {
      await db.update(goals)
        .set({ target })
        .where(eq(goals.id, existingGoal[0].id));
      res.status(200).json({ message: 'Goal updated successfully' });
    } else {
      await db.insert(goals).values({
        year,
        target,
        userId: user.id,
      });
      res.status(201).json({ message: 'Goal set successfully' });
    }
  } catch (error) {
    console.error('Error saving goal:', error);
    if (error.message.includes('Authorization') || error.message.includes('token')) {
      res.status(401).json({ error: 'Authentication failed' });
    } else {
      res.status(500).json({ error: 'Error saving goal' });
    }
  }
}