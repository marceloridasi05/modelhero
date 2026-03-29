import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, timestamp, boolean, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ADMIN_EMAILS = ["marceloribeiro05@gmail.com", "marcelo@thehero.com.br"];

export const userStatusEnum = ["free", "pago", "tester"] as const;
export type UserStatus = typeof userStatusEnum[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  profilePhoto: text("profile_photo"),
  isAdmin: boolean("is_admin").notNull().default(false),
  status: text("status").notNull().default("free"),
  isPaused: boolean("is_paused").notNull().default(false),
  preferredCurrency: text("preferred_currency").notNull().default("BRL"),
  preferredLanguage: text("preferred_language").notNull().default("pt"),
  registrationLanguage: text("registration_language").default("pt"),
  copilotUsageCount: integer("copilot_usage_count").notNull().default(0),
  duplicateCheckUsageCount: integer("duplicate_check_usage_count").notNull().default(0),
  photoAIUsageCount: integer("photo_ai_usage_count").notNull().default(0),
  upgradeClickCount: integer("upgrade_click_count").notNull().default(0),
  acceptedTerms: boolean("accepted_terms").notNull().default(false),
  acceptedTermsAt: timestamp("accepted_terms_at"),
  lastLogin: timestamp("last_login"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  excludeFromMetrics: boolean("exclude_from_metrics").notNull().default(false),
  followUpEmail24hSent: boolean("follow_up_email_24h_sent").notNull().default(false),
  followUpEmail4dSent: boolean("follow_up_email_4d_sent").notNull().default(false),
  followUpEmail10dSent: boolean("follow_up_email_10d_sent").notNull().default(false),
  followUpEmail30dInactiveSent: boolean("follow_up_email_30d_inactive_sent").notNull().default(false),
  limitReachedEmailSent: boolean("limit_reached_email_sent").notNull().default(false),
  gamificationLevel: integer("gamification_level").notNull().default(0),
  levelsUnlocked: text("levels_unlocked").array().default(sql`'{}'::text[]`),
  hasCompletedFirstKit: boolean("has_completed_first_kit").notNull().default(false),
  country: text("country"),
  locale: text("locale"),
  workbenchDays: integer("workbench_days").notNull().default(0),
  lastWorkbenchSessionDate: text("last_workbench_session_date"),
  acquisitionSource: text("acquisition_source"),
  acquisitionMedium: text("acquisition_medium"),
  acquisitionCampaign: text("acquisition_campaign"),
  acquisitionContent: text("acquisition_content"),
  acquisitionTerm: text("acquisition_term"),
  shareToken: text("share_token").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  isGlobal: boolean("is_global").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSessions = pgTable("user_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const exchangeTokens = pgTable("exchange_tokens", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageReads = pgTable("message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

export const workbenchSessionLog = pgTable("workbench_session_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionDate: text("session_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favoriteLinks = pgTable("favorite_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rssFeeds = pgTable("rss_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  siteUrl: text("site_url"),
  lastFetchedAt: timestamp("last_fetched_at"),
  status: text("status").notNull().default("active"),
  errorMessage: text("error_message"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rssFeedItems = pgTable("rss_feed_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feedId: varchar("feed_id").notNull().references(() => rssFeeds.id, { onDelete: "cascade" }),
  guid: text("guid").notNull(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  publishedAt: timestamp("published_at"),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kits = pgTable("kits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  kitNumber: text("kit_number"),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  scale: text("scale").notNull(),
  type: text("type").notNull(),
  tematica: text("tematica").notNull().default("civil"),
  status: text("status").notNull().default("na_caixa"),
  destino: text("destino").notNull().default("nenhum"),
  salePrice: real("sale_price"),
  isForSale: boolean("is_for_sale").notNull().default(false),
  saleListingLinks: text("sale_listing_links").array(),
  etapa: text("etapa"),
  recipientName: text("recipient_name"),
  boxImage: text("box_image"),
  rating: integer("rating").notNull().default(0),
  paidValue: real("paid_value").notNull().default(0),
  paidValueCurrency: text("paid_value_currency").notNull().default("BRL"),
  currentValue: real("current_value").notNull().default(0),
  hoursWorked: real("hours_worked").notNull().default(0),
  progress: integer("progress").notNull().default(0),
  notes: text("notes"),
  aftermarkets: text("aftermarkets").array(),
  militaryInfo: jsonb("military_info"),
  comments: text("comments"),
  instructionImages: text("instruction_images").array(),
  timerStartedAt: text("timer_started_at"),
  paints: jsonb("paints"),
  referencePhotos: jsonb("reference_photos"),
  referenceDocuments: jsonb("reference_documents"),
  usefulLinks: jsonb("useful_links"),
  buildPhotos: jsonb("build_photos"),
  soldDate: timestamp("sold_date"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  kits: many(kits),
  messageReads: many(messageReads),
}));

export const kitsRelations = relations(kits, ({ one }) => ({
  user: one(users, {
    fields: [kits.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  targetUser: one(users, {
    fields: [messages.targetUserId],
    references: [users.id],
  }),
  reads: many(messageReads),
}));

export const messageReadsRelations = relations(messageReads, ({ one }) => ({
  message: one(messages, {
    fields: [messageReads.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReads.userId],
    references: [users.id],
  }),
}));

export const favoriteLinksRelations = relations(favoriteLinks, ({ one }) => ({
  user: one(users, {
    fields: [favoriteLinks.userId],
    references: [users.id],
  }),
}));

export const rssFeedsRelations = relations(rssFeeds, ({ one, many }) => ({
  user: one(users, {
    fields: [rssFeeds.userId],
    references: [users.id],
  }),
  items: many(rssFeedItems),
}));

export const rssFeedItemsRelations = relations(rssFeedItems, ({ one }) => ({
  feed: one(rssFeeds, {
    fields: [rssFeedItems.feedId],
    references: [rssFeeds.id],
  }),
}));

export const materialTypeEnum = ["tintas", "insumos", "ferramentas", "decais"] as const;
export type MaterialType = typeof materialTypeEnum[number];

export const paintTypeEnum = ["acrilica", "esmalte", "laca"] as const;
export type PaintType = typeof paintTypeEnum[number];

export const paintFinishEnum = ["fosco", "satin", "brilho"] as const;
export type PaintFinish = typeof paintFinishEnum[number];

export const toolStateEnum = ["ok", "precisa_manutencao", "trocar"] as const;
export type ToolState = typeof toolStateEnum[number];

export const unitEnum = ["ml", "g", "unidades", "folhas", "frascos"] as const;
export type MaterialUnit = typeof unitEnum[number];

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  brand: text("brand"),
  unit: text("unit").notNull().default("unidades"),
  currentQuantity: real("current_quantity").notNull().default(0),
  minQuantity: real("min_quantity").notNull().default(0),
  paintLine: text("paint_line"),
  paintCode: text("paint_code"),
  paintColor: text("paint_color"),
  paintHexColor: text("paint_hex_color"),
  paintReference: text("paint_reference"),
  paintType: text("paint_type"),
  paintFinish: text("paint_finish"),
  supplyType: text("supply_type"),
  toolType: text("tool_type"),
  toolState: text("tool_state"),
  toolLastMaintenance: timestamp("tool_last_maintenance"),
  decalScale: text("decal_scale"),
  decalBrand: text("decal_brand"),
  decalForKit: text("decal_for_kit"),
  decalForUnit: text("decal_for_unit"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materialsRelations = relations(materials, ({ one }) => ({
  user: one(users, {
    fields: [materials.userId],
    references: [users.id],
  }),
}));

// IA Actions log table - tracks all AI feature usage
export const iaActions = pgTable("ia_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(), // 'copilot', 'duplicate_check', 'photo_ai', etc.
  metadata: jsonb("metadata"), // Optional additional data about the action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const iaActionsRelations = relations(iaActions, ({ one }) => ({
  user: one(users, {
    fields: [iaActions.userId],
    references: [users.id],
  }),
}));

// Admin settings for cost configuration
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User funnel events for tracking conversion stages
export const userEvents = pgTable("user_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventName: text("event_name").notNull(), // 'sign_up', 'kit_created_1', 'kit_created_3', etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userEventsRelations = relations(userEvents, ({ one }) => ({
  user: one(users, {
    fields: [userEvents.userId],
    references: [users.id],
  }),
}));

export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  brand: text("brand").notNull().default(""),
  scale: text("scale").notNull().default(""),
  currentPrice: real("current_price").notNull().default(0),
  purchaseLinks: jsonb("purchase_links"),
  comments: text("comments"),
  photos: jsonb("photos"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
}));

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

/**
 * Password complexity validation (P2-4)
 * Requires: 12+ chars, uppercase, lowercase, number
 */
const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{12,}$/;
const passwordComplexityMessage =
  "Senha deve ter no mínimo 12 caracteres com maiúscula, minúscula e número";

export const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().regex(
    passwordComplexityRegex,
    passwordComplexityMessage
  ),
  confirmPassword: z.string().min(1, "Confirme sua senha"),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos de uso",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().regex(
    passwordComplexityRegex,
    passwordComplexityMessage
  ),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const insertKitSchema = createInsertSchema(kits).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertMessageReadSchema = createInsertSchema(messageReads).omit({
  id: true,
  readAt: true,
});

export const insertFavoriteLinkSchema = createInsertSchema(favoriteLinks).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertRssFeedSchema = createInsertSchema(rssFeeds).omit({
  id: true,
  userId: true,
  lastFetchedAt: true,
  status: true,
  errorMessage: true,
  createdAt: true,
});

export const insertRssFeedItemSchema = createInsertSchema(rssFeedItems).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertIaActionSchema = createInsertSchema(iaActions).omit({
  id: true,
  createdAt: true,
});

export const insertUserEventSchema = createInsertSchema(userEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertKit = z.infer<typeof insertKitSchema>;
export type Kit = typeof kits.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessageRead = z.infer<typeof insertMessageReadSchema>;
export type MessageRead = typeof messageReads.$inferSelect;
export type InsertFavoriteLink = z.infer<typeof insertFavoriteLinkSchema>;
export type FavoriteLink = typeof favoriteLinks.$inferSelect;
export type InsertRssFeed = z.infer<typeof insertRssFeedSchema>;
export type RssFeed = typeof rssFeeds.$inferSelect;
export type InsertRssFeedItem = z.infer<typeof insertRssFeedItemSchema>;
export type RssFeedItem = typeof rssFeedItems.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertIaAction = z.infer<typeof insertIaActionSchema>;
export type IaAction = typeof iaActions.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertUserEvent = z.infer<typeof insertUserEventSchema>;
export type UserEvent = typeof userEvents.$inferSelect;

// Gamification types
export const GAMIFICATION_LEVELS = [
  { level: 1, name: "Iniciante", itemsRequired: 1 },
  { level: 2, name: "Bronze", itemsRequired: 8 },
  { level: 3, name: "Prata", itemsRequired: 20 },
  { level: 4, name: "Ouro", itemsRequired: 50 },
  { level: 5, name: "Diamante", itemsRequired: 100 },
] as const;

export interface GamificationStatus {
  totalItems: number;
  currentLevel: number;
  currentLevelName: string;
  nextLevelItemsRequired: number | null;
  itemsToNextLevel: number | null;
  progressPercent: number;
  isMaxLevel: boolean;
  newLevelUnlocked: number | null;
}
