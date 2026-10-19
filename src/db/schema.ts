import { boolean, date, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const offers = pgTable("offers", {
  id: text("id").primaryKey(), // slug w adresie /oferta/<id>
  variety: text("variety").notNull(),
  title: text("title").notNull(),
  breeder: text("breeder").notNull().default(""),
  age: text("age").notNull().default(""),
  sizeMin: integer("size_min").notNull(),
  sizeMax: integer("size_max").notNull(),
  count: integer("count").notNull(),
  /** Numery ryb sprzedanych albo zarezerwowanych w zamówieniach. */
  sold: integer("sold").array().notNull().default([]),
  /** Ryby sprzedane „z grupy”, bez wskazanego numeru. */
  groupSold: integer("group_sold").notNull().default(0),
  /** Cena za sztukę w zł; null = „zapytaj o cenę”. */
  price: integer("price"),
  videoUrl: text("video_url"),
  posterUrl: text("poster_url"),
  videoLength: text("video_length"),
  description: text("description").notNull().default(""),
  published: boolean("published").notNull().default(true),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  no: text("no").notNull().unique(),
  status: text("status").notNull().default("nowe"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  street: text("street").notNull().default(""),
  city: text("city").notNull().default(""),
  delivery: text("delivery").notNull(),
  day: date("day").notNull(),
  payment: text("payment").notNull(),
  itemsTotal: integer("items_total").notNull(),
  deliveryPrice: integer("delivery_price").notNull(),
  total: integer("total").notNull(),
  trackingNo: text("tracking_no"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  offerId: text("offer_id").notNull().references(() => offers.id),
  title: text("title").notNull(),
  qty: integer("qty").notNull(),
  picks: integer("picks").array(),
  unitPrice: integer("unit_price").notNull(),
});

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  offerId: text("offer_id").notNull().references(() => offers.id),
  qty: integer("qty").notNull(),
  picks: integer("picks").array(),
  second: text("second").notNull().default(""),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("nowe"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
