import { pgTable, serial, text, timestamp, uuid, integer, varchar } from 'drizzle-orm/pg-core';

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  rating: integer('rating'),
  review: text('review'),
  createdAt: timestamp('created_at').defaultNow(),
  userId: uuid('user_id').notNull(),
});

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  target: integer('target').notNull(),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});