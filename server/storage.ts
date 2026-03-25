import {
  users,
  kits,
  messages,
  messageReads,
  workbenchSessionLog,
  favoriteLinks,
  rssFeeds,
  rssFeedItems,
  materials,
  wishlistItems,
  iaActions,
  adminSettings,
  userEvents,
  type User,
  type InsertUser,
  type Kit,
  type InsertKit,
  type Message,
  type InsertMessage,
  type MessageRead,
  type FavoriteLink,
  type InsertFavoriteLink,
  type RssFeed,
  type InsertRssFeed,
  type RssFeedItem,
  type InsertRssFeedItem,
  type Material,
  type InsertMaterial,
  type WishlistItem,
  type InsertWishlistItem,
  type InsertIaAction,
  type IaAction,
  type AdminSetting,
  ADMIN_EMAILS,
} from "@shared/schema";
import { db } from "./db";
import { randomUUID } from "crypto";
import {
  eq,
  sql,
  and,
  or,
  isNull,
  isNotNull,
  notInArray,
  gte,
  lte,
  desc,
} from "drizzle-orm";

export interface KitStatistics {
  kitsByStatus: { status: string; count: number }[];
  kitsByScale: { scale: string; count: number }[];
  kitsByCategory: { category: string; count: number }[];
  topBrands: { brand: string; count: number }[];
  soldKitsCount: number;
  soldKitsValueByMonth: { month: string; value: number }[];
  totalSoldKitsValue: number;
  investmentByCategory: { category: string; investment: number }[];
  kitsForSaleCount: number;
  totalForSaleValue: number;
  forSaleVsSoldByMonth: { month: string; forSale: number; sold: number }[];
}

export interface IaUsageDistribution {
  oneAction: number;
  twoToFiveActions: number;
  sixToTwentyActions: number;
  moreThanTwentyActions: number;
}

export interface AdminMetrics {
  totalUsers: number;
  totalKits: number;
  averageKitsPerUser: number;
  usersWithAtLeastOneKit: number;
  usersWithTwoOrMoreKits: number;
  averageHoursToFirstKit: number;
  usersAtFreeLimit: number;
  excludedUsersCount: number;
  // New retroactive metrics
  totalMaterials: number;
  totalItems: number;
  averageItemsPerUser: number;
  usersWithNoItems: number;
  usersActive7Days: number;
  usersActive30Days: number;
  paidUsersCount: number;
  conversionRate: number;
  // IA Metrics
  iaUsersCount: number;
  iaUsersNeverUsedCount: number;
  iaUsersNeverUsedPercentage: number;
  iaActionsTotal: number;
  iaActionsPerUserAverage: number;
  iaUsageDistribution: IaUsageDistribution;
  paidUsersIaCount: number;
  paidUsersIaPercentage: number;
  iaActionsPerPaidUserAverage: number;
  // Activation metrics
  avgDaysToTenItems: number;
  usersWithTenOrMoreItems: number;
  usersWithExactlyOneItem: number;
  // Country signups (respects period filter)
  signupsBR: number;
  signupsES: number;
  signupsPT: number;
  // Presence D+1 retention
  presenceD1Rate: number;
  presenceD1UsersReturned: number;
  presenceD1UsersTotal: number;
  // Streak ≥3 days (Ritual installed)
  streakRitualRate: number;
  streakRitualUsers: number;
  streakRitualActiveWeekUsers: number;
  // Spontaneous action (without nudge)
  spontaneousActionRate: number;
  spontaneousActionUsers: number;
  spontaneousActionTotalActive: number;
}

export interface UserWithKitCounts extends User {
  kitCount: number;
  kitsForSaleCount: number;
  upgradeClickCount: number;
  paintCount: number;
  supplyCount: number;
  toolCount: number;
  decalCount: number;
  totalItemsCount: number;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByShareToken(shareToken: string): Promise<User | undefined>;
  ensureShareToken(userId: string): Promise<string>;
  createUser(user: InsertUser): Promise<User>;
  updateLastLogin(userId: string): Promise<void>;
  updateUserProfile(
    userId: string,
    data: { profilePhoto?: string },
  ): Promise<User | undefined>;

  getAllUsers(
    startDate?: string,
    endDate?: string,
  ): Promise<UserWithKitCounts[]>;
  updateUserStatus(userId: string, status: string): Promise<User | undefined>;
  updateUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined>;
  updateUserPaused(
    userId: string,
    isPaused: boolean,
  ): Promise<User | undefined>;
  updateUserPreferredCurrency(
    userId: string,
    currency: string,
  ): Promise<User | undefined>;
  updateUserPreferredLanguage(
    userId: string,
    language: string,
  ): Promise<User | undefined>;
  incrementCopilotUsage(userId: string): Promise<void>;
  incrementDuplicateCheckUsage(userId: string): Promise<void>;
  incrementPhotoAIUsage(userId: string): Promise<void>;
  incrementUpgradeClickCount(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<boolean>;
  resetUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<User | undefined>;

  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  updateUserStripeCustomerId(
    userId: string,
    stripeCustomerId: string,
  ): Promise<User | undefined>;
  updateUserSubscription(
    userId: string,
    data: { stripeSubscriptionId: string | null; status: string },
  ): Promise<User | undefined>;

  getKitsByUser(userId: string): Promise<Kit[]>;
  getKitsListByUser(userId: string): Promise<any[]>;
  getRecentGlobalKits(
    limit?: number,
  ): Promise<Pick<Kit, "id" | "name" | "brand" | "scale" | "boxImage">[]>;
  getGlobalStats(): Promise<{
    topBrands: { brand: string; count: number }[];
    topKits: { name: string; brand: string; scale: string; count: number }[];
    topScales: { scale: string; count: number }[];
  }>;
  getKitCountByUser(userId: string): Promise<number>;
  getKitsForSaleCountByUser(userId: string): Promise<number>;
  getKit(id: string, userId: string): Promise<Kit | undefined>;
  getKitByNumber(
    kitNumber: string,
  ): Promise<{ name: string; scale: string; brand: string } | null>;
  createKit(userId: string, kit: InsertKit): Promise<Kit>;
  updateKit(
    id: string,
    userId: string,
    kit: Partial<InsertKit>,
  ): Promise<Kit | undefined>;
  deleteKit(id: string, userId: string): Promise<boolean>;
  duplicateKit(id: string, userId: string): Promise<Kit | undefined>;

  getStatistics(userId: string): Promise<KitStatistics>;

  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(
    messageId: string,
    data: { title: string; content: string },
  ): Promise<Message | undefined>;
  deleteMessage(messageId: string): Promise<boolean>;
  getUnreadMessages(userId: string): Promise<Message[]>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  getAllMessages(): Promise<Message[]>;

  getFavoriteLinks(userId: string): Promise<FavoriteLink[]>;
  createFavoriteLink(
    userId: string,
    link: InsertFavoriteLink,
  ): Promise<FavoriteLink>;
  updateFavoriteLink(
    id: string,
    userId: string,
    link: Partial<InsertFavoriteLink>,
  ): Promise<FavoriteLink | undefined>;
  deleteFavoriteLink(id: string, userId: string): Promise<boolean>;

  getRssFeeds(userId: string): Promise<RssFeed[]>;
  getRssFeed(id: string, userId: string): Promise<RssFeed | undefined>;
  createRssFeed(userId: string, feed: InsertRssFeed): Promise<RssFeed>;
  updateRssFeed(
    id: string,
    data: Partial<RssFeed>,
  ): Promise<RssFeed | undefined>;
  deleteRssFeed(id: string, userId: string): Promise<boolean>;

  getRssFeedItems(
    feedIds: string[],
    limit?: number,
  ): Promise<(RssFeedItem & { feedTitle: string })[]>;
  createRssFeedItem(item: InsertRssFeedItem): Promise<RssFeedItem>;
  deleteOldRssFeedItems(feedId: string, keepCount: number): Promise<void>;
  getRssFeedItemByGuid(
    feedId: string,
    guid: string,
  ): Promise<RssFeedItem | undefined>;
  updateRssFeedsOrder(userId: string, feedIds: string[]): Promise<void>;

  getMaterials(userId: string, type?: string): Promise<Material[]>;
  getMaterial(id: string, userId: string): Promise<Material | undefined>;
  getMaterialCountByUser(userId: string): Promise<number>;
  getPaintCountByUser(userId: string): Promise<number>;
  createMaterial(userId: string, material: InsertMaterial): Promise<Material>;
  updateMaterial(
    id: string,
    userId: string,
    material: Partial<InsertMaterial>,
  ): Promise<Material | undefined>;
  deleteMaterial(id: string, userId: string): Promise<boolean>;
  findPaintByBrandAndCode(
    userId: string,
    brand: string,
    code: string,
  ): Promise<Material | undefined>;
  findMaterialByTypeAndName(
    userId: string,
    type: string,
    name: string,
    brand?: string,
  ): Promise<Material | undefined>;
  findPaintByColorName(
    userId: string,
    colorName: string,
  ): Promise<Material | undefined>;
  getPaintsByBrand(userId: string, brand: string): Promise<Material[]>;

  getWishlistItems(userId: string): Promise<WishlistItem[]>;
  getWishlistItem(
    id: string,
    userId: string,
  ): Promise<WishlistItem | undefined>;
  getWishlistCountByUser(userId: string): Promise<number>;
  createWishlistItem(
    userId: string,
    item: InsertWishlistItem,
  ): Promise<WishlistItem>;
  updateWishlistItem(
    id: string,
    userId: string,
    item: Partial<InsertWishlistItem>,
  ): Promise<WishlistItem | undefined>;
  deleteWishlistItem(id: string, userId: string): Promise<boolean>;

  getTotalItemCount(userId: string): Promise<number>;

  getAdminMetrics(
    startDate?: Date,
    endDate?: Date,
    freeLimit?: number,
  ): Promise<AdminMetrics>;

  // IA Actions
  logIaAction(
    userId: string,
    actionType: string,
    metadata?: Record<string, unknown>,
  ): Promise<IaAction>;
  getIaActionsByUser(userId: string): Promise<IaAction[]>;

  // Admin Settings
  getAdminSetting(key: string): Promise<string | null>;
  setAdminSetting(key: string, value: string): Promise<void>;
  getAllAdminSettings(): Promise<Record<string, string>>;

  // Exclude from metrics
  updateUserExcludeFromMetrics(
    userId: string,
    excludeFromMetrics: boolean,
  ): Promise<User | undefined>;
  getExcludedFromMetricsCount(): Promise<number>;

  // Follow-up emails
  getUsersForFollowUpEmails(): Promise<{
    email24h: User[];
    email4d: User[];
    email10d: User[];
  }>;
  markFollowUpEmailSent(
    userId: string,
    emailType: "24h" | "4d" | "10d",
  ): Promise<void>;
  getUsersFor30dInactivityEmail(): Promise<User[]>;
  mark30dInactivityEmailSent(userId: string): Promise<void>;

  // Gamification
  getGamificationStatus(userId: string): Promise<{
    totalItems: number;
    currentLevel: number;
    currentLevelName: string;
    nextLevelItemsRequired: number | null;
    itemsToNextLevel: number | null;
    progressPercent: number;
    isMaxLevel: boolean;
    newLevelUnlocked: number | null;
  }>;
  updateGamificationLevelRetroactive(userId: string): Promise<void>;
  acknowledgeLevelUp(userId: string, level: number): Promise<void>;
  markFirstKitCompleted(userId: string): Promise<void>;
  updateWorkbenchSession(
    userId: string,
    workbenchDays: number,
    lastSessionDate: string,
  ): Promise<void>;

  // User Events for Funnel Tracking
  logUserEvent(
    userId: string,
    eventName: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  hasUserEvent(userId: string, eventName: string): Promise<boolean>;
  getFunnelData(
    startDate?: string,
    endDate?: string,
    registrationLanguage?: string,
    country?: string,
  ): Promise<{ eventName: string; count: number }[]>;
  backfillFunnelEvents(): Promise<{
    signups: number;
    kit1: number;
    kit3: number;
    kit5: number;
    kit7: number;
    kit10: number;
    upgrades: number;
  }>;
  getUpgradeClicksInPeriod(
    startDate?: string,
    endDate?: string,
  ): Promise<number>;
  getWelcomeModalStats(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    shown: number;
    ctaClicked: number;
    closedWithoutAction: number;
    es: { shown: number; ctaClicked: number; closedWithoutAction: number };
    pt: { shown: number; ctaClicked: number; closedWithoutAction: number };
    br: { shown: number; ctaClicked: number; closedWithoutAction: number };
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByShareToken(shareToken: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.shareToken, shareToken));
    return user || undefined;
  }

  async ensureShareToken(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    if (user.shareToken) return user.shareToken;
    const token = randomUUID();
    await db.update(users).set({ shareToken: token }).where(eq(users.id, userId));
    return token;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const isAdmin = ADMIN_EMAILS.includes(insertUser.email);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, isAdmin })
      .returning();
    return user;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(
    userId: string,
    data: { profilePhoto?: string },
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getAllUsers(
    startDate?: string,
    endDate?: string,
  ): Promise<UserWithKitCounts[]> {
    let query = db.select().from(users);

    const conditions: any[] = [];
    if (startDate) {
      const startDateTime = new Date(startDate + "T00:00:00-03:00");
      conditions.push(gte(users.createdAt, startDateTime));
    }
    if (endDate) {
      const endDateTime = new Date(endDate + "T23:59:59-03:00");
      conditions.push(lte(users.createdAt, endDateTime));
    }

    const allUsers =
      conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;
    const result: UserWithKitCounts[] = [];
    for (const user of allUsers) {
      const kitCount = await this.getKitCountByUser(user.id);
      const kitsForSaleCount = await this.getKitsForSaleCountByUser(user.id);

      const [paintCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(materials)
        .where(
          and(eq(materials.userId, user.id), eq(materials.type, "tintas")),
        );
      const paintCount = paintCountResult?.count || 0;

      const [supplyCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(materials)
        .where(
          and(eq(materials.userId, user.id), eq(materials.type, "insumos")),
        );
      const supplyCount = supplyCountResult?.count || 0;

      const [toolCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(materials)
        .where(
          and(eq(materials.userId, user.id), eq(materials.type, "ferramentas")),
        );
      const toolCount = toolCountResult?.count || 0;

      const [decalCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(materials)
        .where(
          and(eq(materials.userId, user.id), eq(materials.type, "decais")),
        );
      const decalCount = decalCountResult?.count || 0;

      const totalItemsCount =
        kitCount +
        Number(paintCount) +
        Number(supplyCount) +
        Number(toolCount) +
        Number(decalCount);

      result.push({
        ...user,
        kitCount,
        kitsForSaleCount,
        paintCount: Number(paintCount),
        supplyCount: Number(supplyCount),
        toolCount: Number(toolCount),
        decalCount: Number(decalCount),
        totalItemsCount,
      });
    }
    return result;
  }

  async updateUserStatus(
    userId: string,
    status: string,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserAdmin(
    userId: string,
    isAdmin: boolean,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserPaused(
    userId: string,
    isPaused: boolean,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ isPaused })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserPreferredCurrency(
    userId: string,
    currency: string,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ preferredCurrency: currency })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserPreferredLanguage(
    userId: string,
    language: string,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ preferredLanguage: language })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getUserByStripeCustomerId(
    customerId: string,
  ): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    return user || undefined;
  }

  async updateUserStripeCustomerId(
    userId: string,
    stripeCustomerId: string,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserSubscription(
    userId: string,
    data: { stripeSubscriptionId: string | null; status: string },
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async incrementCopilotUsage(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        copilotUsageCount: sql`COALESCE(${users.copilotUsageCount}, 0) + 1`,
      })
      .where(eq(users.id, userId));
  }

  async incrementDuplicateCheckUsage(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        duplicateCheckUsageCount: sql`COALESCE(${users.duplicateCheckUsageCount}, 0) + 1`,
      })
      .where(eq(users.id, userId));
  }

  async incrementPhotoAIUsage(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        photoAIUsageCount: sql`COALESCE(${users.photoAIUsageCount}, 0) + 1`,
      })
      .where(eq(users.id, userId));
  }

  async incrementUpgradeClickCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        upgradeClickCount: sql`COALESCE(${users.upgradeClickCount}, 0) + 1`,
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Delete all related records before deleting user
    await db.delete(kits).where(eq(kits.userId, userId));
    await db.delete(messageReads).where(eq(messageReads.userId, userId));
    await db.delete(messages).where(eq(messages.targetUserId, userId));
    await db.delete(favoriteLinks).where(eq(favoriteLinks.userId, userId));
    // rssFeedItems will be cascade deleted when rssFeeds are deleted
    await db.delete(rssFeeds).where(eq(rssFeeds.userId, userId));
    await db.delete(materials).where(eq(materials.userId, userId));
    await db.delete(wishlistItems).where(eq(wishlistItems.userId, userId));
    await db.delete(userEvents).where(eq(userEvents.userId, userId));
    await db.delete(iaActions).where(eq(iaActions.userId, userId));
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  async resetUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getKitsByUser(userId: string): Promise<Kit[]> {
    const result = await db.select().from(kits).where(eq(kits.userId, userId));

    return result;
  }

  async getKitsListByUser(userId: string) {
    const result = await db.select({
      id: kits.id,
      userId: kits.userId,
      kitNumber: kits.kitNumber,
      name: kits.name,
      brand: kits.brand,
      scale: kits.scale,
      type: kits.type,
      tematica: kits.tematica,
      status: kits.status,
      destino: kits.destino,
      salePrice: kits.salePrice,
      isForSale: kits.isForSale,
      saleListingLinks: kits.saleListingLinks,
      etapa: kits.etapa,
      recipientName: kits.recipientName,
      boxImage: kits.boxImage,
      rating: kits.rating,
      paidValue: kits.paidValue,
      paidValueCurrency: kits.paidValueCurrency,
      currentValue: kits.currentValue,
      hoursWorked: kits.hoursWorked,
      progress: kits.progress,
      timerStartedAt: kits.timerStartedAt,
      paints: kits.paints,
      usefulLinks: kits.usefulLinks,
      soldDate: kits.soldDate,
      startDate: kits.startDate,
      endDate: kits.endDate,
      createdAt: kits.createdAt,
    }).from(kits).where(eq(kits.userId, userId));

    return result;
  }

  async getRecentGlobalKits(
    limit: number = 30,
  ): Promise<Pick<Kit, "id" | "name" | "brand" | "scale" | "boxImage">[]> {
    const result = await db
      .select({
        id: kits.id,
        name: kits.name,
        brand: kits.brand,
        scale: kits.scale,
        boxImage: kits.boxImage,
      })
      .from(kits)
      .where(
        and(
          isNotNull(kits.boxImage),
          isNotNull(kits.name),
          isNotNull(kits.brand),
          isNotNull(kits.scale),
          sql`${kits.boxImage} != ''`,
          sql`${kits.name} != ''`,
          sql`${kits.brand} != ''`,
          sql`${kits.scale} != ''`,
        ),
      )
      .orderBy(desc(kits.createdAt))
      .limit(limit);

    return result as Pick<
      Kit,
      "id" | "name" | "brand" | "scale" | "boxImage"
    >[];
  }

  async getGlobalStats(): Promise<{
    topBrands: { brand: string; count: number }[];
    topKits: { name: string; brand: string; scale: string; count: number }[];
    topScales: { scale: string; count: number }[];
  }> {
    // Top 5 brands
    const topBrandsResult = await db
      .select({
        brand: kits.brand,
        count: sql<number>`count(*)::int`,
      })
      .from(kits)
      .where(and(isNotNull(kits.brand), sql`${kits.brand} != ''`))
      .groupBy(kits.brand)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    // Top 5 kits (by distinct users who registered the same name+brand+scale)
    const topKitsResult = await db
      .select({
        name: kits.name,
        brand: kits.brand,
        scale: kits.scale,
        count: sql<number>`count(distinct ${kits.userId})::int`,
      })
      .from(kits)
      .where(
        and(
          isNotNull(kits.name),
          isNotNull(kits.brand),
          isNotNull(kits.scale),
          sql`${kits.name} != ''`,
          sql`${kits.brand} != ''`,
          sql`${kits.scale} != ''`,
        ),
      )
      .groupBy(kits.name, kits.brand, kits.scale)
      .orderBy(sql`count(distinct ${kits.userId}) desc`)
      .limit(5);

    // Top 5 scales
    const topScalesResult = await db
      .select({
        scale: kits.scale,
        count: sql<number>`count(*)::int`,
      })
      .from(kits)
      .where(and(isNotNull(kits.scale), sql`${kits.scale} != ''`))
      .groupBy(kits.scale)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    return {
      topBrands: topBrandsResult as { brand: string; count: number }[],
      topKits: topKitsResult as {
        name: string;
        brand: string;
        scale: string;
        count: number;
      }[],
      topScales: topScalesResult as { scale: string; count: number }[],
    };
  }

  async getKitCountByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(kits)
      .where(eq(kits.userId, userId));
    return Number(result[0]?.count) || 0;
  }

  async getKitsForSaleCountByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(kits)
      .where(
        and(
          eq(kits.userId, userId),
          or(eq(kits.destino, "a_venda"), eq(kits.isForSale, true)),
        ),
      );
    return Number(result[0]?.count) || 0;
  }

  async getKit(id: string, userId: string): Promise<Kit | undefined> {
    const [kit] = await db.select().from(kits).where(eq(kits.id, id));
    if (kit && kit.userId === userId) {
      return kit;
    }
    return undefined;
  }

  async getKitByNumber(
    kitNumber: string,
  ): Promise<{ name: string; scale: string; brand: string } | null> {
    if (!kitNumber || kitNumber.trim() === "") return null;
    const [kit] = await db
      .select({ name: kits.name, scale: kits.scale, brand: kits.brand })
      .from(kits)
      .where(eq(kits.kitNumber, kitNumber.trim()))
      .limit(1);
    return kit || null;
  }

  async createKit(userId: string, kit: InsertKit): Promise<Kit> {
    const safeKit: InsertKit = {
      ...kit,

      name: kit.name?.trim() || "Kit sem nome",
      brand: kit.brand?.trim() || "",
      type: kit.type?.trim() || "Outro",
      scale: kit.scale?.trim() || "",

      status: kit.status ?? "na_caixa",
      destino: kit.destino ?? "nenhum",
      etapa: kit.etapa ?? "preparo",

      paints: Array.isArray(kit.paints) ? kit.paints : [],
      referencePhotos: Array.isArray(kit.referencePhotos)
        ? kit.referencePhotos
        : [],
      buildPhotos: Array.isArray(kit.buildPhotos) ? kit.buildPhotos : [],
      referenceDocuments: Array.isArray(kit.referenceDocuments)
        ? kit.referenceDocuments
        : [],
      aftermarkets: Array.isArray(kit.aftermarkets) ? kit.aftermarkets : [],
      usefulLinks: Array.isArray(kit.usefulLinks) ? kit.usefulLinks : [],
    };

    const [newKit] = await db
      .insert(kits)
      .values({ ...safeKit, userId })
      .returning();

    return newKit;
  }

  async updateKit(
    id: string,
    userId: string,
    kit: Partial<InsertKit>,
  ): Promise<Kit | undefined> {
    const existing = await this.getKit(id, userId);
    if (!existing) return undefined;

    const {
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      ...updateData
    } = kit as any;

    const arrayFields = ['paints', 'referencePhotos', 'buildPhotos', 'referenceDocuments', 'aftermarkets', 'usefulLinks'] as const;
    const safeUpdate = { ...updateData };
    for (const field of arrayFields) {
      if (safeUpdate[field] === undefined) {
        delete safeUpdate[field];
      } else if (!Array.isArray(safeUpdate[field])) {
        safeUpdate[field] = existing[field] || [];
      }
    }

    const [updated] = await db
      .update(kits)
      .set(safeUpdate)
      .where(eq(kits.id, id))
      .returning();
    return updated;
  }

  async deleteKit(id: string, userId: string): Promise<boolean> {
    const existing = await this.getKit(id, userId);
    if (!existing) return false;

    await db.delete(kits).where(eq(kits.id, id));
    return true;
  }

  async duplicateKit(id: string, userId: string): Promise<Kit | undefined> {
    const existing = await this.getKit(id, userId);
    if (!existing) return undefined;

    const {
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      ...kitData
    } = existing;

    const isObjectStorageUrl = (url: string | null | undefined): boolean => {
      return !!url && (url.startsWith("/objects/") || url.startsWith("http"));
    };

    const boxImage = isObjectStorageUrl(existing.boxImage)
      ? existing.boxImage
      : null;

    const filterPhotos = (photos: any[] | null | undefined) => {
      if (!Array.isArray(photos)) return [];
      return photos.filter((p: any) => isObjectStorageUrl(p?.url));
    };

    const [newKit] = await db
      .insert(kits)
      .values({
        ...kitData,
        userId,
        name: `${existing.name} (cópia)`,
        hoursWorked: 0,
        progress: 0,
        timerStartedAt: null,
        boxImage,
        referencePhotos: filterPhotos(existing.referencePhotos as any),
        buildPhotos: filterPhotos(existing.buildPhotos as any),
        referenceDocuments: [],
      })
      .returning();

    return newKit;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async updateMessage(
    messageId: string,
    data: { title: string; content: string },
  ): Promise<Message | undefined> {
    const [updated] = await db
      .update(messages)
      .set(data)
      .where(eq(messages.id, messageId))
      .returning();
    return updated || undefined;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    await db.delete(messageReads).where(eq(messageReads.messageId, messageId));
    const result = await db
      .delete(messages)
      .where(eq(messages.id, messageId))
      .returning();
    return result.length > 0;
  }

  async getUnreadMessages(userId: string): Promise<Message[]> {
    const readMessageIds = await db
      .select({ messageId: messageReads.messageId })
      .from(messageReads)
      .where(eq(messageReads.userId, userId));
    const readIds = readMessageIds.map((r) => r.messageId);

    if (readIds.length === 0) {
      return db
        .select()
        .from(messages)
        .where(
          or(eq(messages.isGlobal, true), eq(messages.targetUserId, userId)),
        );
    }

    return db
      .select()
      .from(messages)
      .where(
        and(
          or(eq(messages.isGlobal, true), eq(messages.targetUserId, userId)),
          notInArray(messages.id, readIds),
        ),
      );
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await db
      .insert(messageReads)
      .values({ messageId, userId })
      .onConflictDoNothing();
  }

  async getAllMessages(): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .orderBy(sql`created_at DESC`);
  }

  async getStatistics(userId: string): Promise<KitStatistics> {
    const userKits = await this.getKitsListByUser(userId);

    // Normalization functions to avoid duplicates
    const normalizeScale = (scale: string): string => {
      if (!scale) return "Desconhecida";
      // Convert 1/XX format to 1:XX
      const normalized = scale.replace("/", ":").trim();
      const validScales = [
        "1:24",
        "1:32",
        "1:35",
        "1:48",
        "1:72",
        "1:144",
        "1:350",
        "1:700",
      ];
      const exactMatch = validScales.find(
        (s) => s.toLowerCase() === normalized.toLowerCase(),
      );
      if (exactMatch) return exactMatch;
      const numMatch = normalized.match(/1[:/](\d+)/);
      if (numMatch) {
        const num = numMatch[1];
        const found = validScales.find((s) => s.includes(num));
        if (found) return found;
      }
      return scale;
    };

    const normalizeBrand = (brand: string): string => {
      if (!brand) return "Desconhecida";
      // Known brands with proper capitalization
      const knownBrands: Record<string, string> = {
        academy: "Academy",
        tamiya: "Tamiya",
        revell: "Revell",
        hasegawa: "Hasegawa",
        italeri: "Italeri",
        airfix: "Airfix",
        eduard: "Eduard",
        fujimi: "Fujimi",
        bandai: "Bandai",
        trumpeter: "Trumpeter",
        dragon: "Dragon",
        "hobby boss": "Hobby Boss",
        hobbyboss: "Hobby Boss",
        icm: "ICM",
        zvezda: "Zvezda",
        meng: "Meng",
        takom: "Takom",
        "afv club": "AFV Club",
        "fine molds": "Fine Molds",
        aoshima: "Aoshima",
        esci: "ESCI",
        monogram: "Monogram",
        amt: "AMT",
        mpc: "MPC",
        lindberg: "Lindberg",
      };
      const brandLower = brand.toLowerCase().trim();
      return (
        knownBrands[brandLower] ||
        brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()
      );
    };

    const normalizeType = (type: string): string => {
      if (!type) return "Outro";
      const typeLower = type
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const typeMap: Record<string, string> = {
        aviao: "Avião",
        avião: "Avião",
        helicoptero: "Helicóptero",
        helicóptero: "Helicóptero",
        militaria: "Militaria",
        militar: "Militaria",
        tanque: "Militaria",
        veiculo: "Veículo",
        veículo: "Veículo",
        carro: "Veículo",
        navio: "Navio",
        submarino: "Submarino",
        figura: "Figura",
        diorama: "Diorama",
        "sci-fi": "Sci-Fi",
        scifi: "Sci-Fi",
        outro: "Outro",
      };
      return typeMap[typeLower] || type;
    };

    const kitsByStatus: { [key: string]: number } = {};
    const kitsByScale: { [key: string]: number } = {};
    const kitsByCategory: { [key: string]: number } = {};
    const brandCounts: { [key: string]: number } = {};
    const investmentByCategory: { [key: string]: number } = {};
    const soldKitsValueByMonth: { [key: string]: number } = {};
    const forSaleByMonth: { [key: string]: number } = {};
    const soldByMonth: { [key: string]: number } = {};
    let soldKitsCount = 0;
    let totalSoldKitsValue = 0;
    let kitsForSaleCount = 0;
    let totalForSaleValue = 0;

    for (const kit of userKits) {
      const normalizedScale = normalizeScale(kit.scale);
      const normalizedBrand = normalizeBrand(kit.brand);
      const normalizedType = normalizeType(kit.type);

      // Count sold kits separately - they don't count in total stats
      if (kit.destino === "vendido") {
        soldKitsCount++;
        const soldValue = kit.salePrice || kit.currentValue || 0;
        totalSoldKitsValue += soldValue;
        const month = kit.soldDate
          ? new Date(kit.soldDate).toISOString().slice(0, 7)
          : kit.createdAt
            ? new Date(kit.createdAt).toISOString().slice(0, 7)
            : "unknown";
        soldKitsValueByMonth[month] =
          (soldKitsValueByMonth[month] || 0) + soldValue;
        forSaleByMonth[month] = (forSaleByMonth[month] || 0) + soldValue;
        soldByMonth[month] = (soldByMonth[month] || 0) + soldValue;
        continue; // Skip counting sold kits in general statistics
      }

      // Only count non-sold kits in general stats
      kitsByStatus[kit.status] = (kitsByStatus[kit.status] || 0) + 1;
      kitsByScale[normalizedScale] = (kitsByScale[normalizedScale] || 0) + 1;
      kitsByCategory[normalizedType] =
        (kitsByCategory[normalizedType] || 0) + 1;
      brandCounts[normalizedBrand] = (brandCounts[normalizedBrand] || 0) + 1;
      investmentByCategory[normalizedType] =
        (investmentByCategory[normalizedType] || 0) + kit.paidValue;

      if (kit.destino === "a_venda" || kit.isForSale) {
        kitsForSaleCount++;
        totalForSaleValue += kit.salePrice || kit.currentValue || 0;
        const month = kit.createdAt
          ? new Date(kit.createdAt).toISOString().slice(0, 7)
          : "unknown";
        forSaleByMonth[month] =
          (forSaleByMonth[month] || 0) +
          (kit.salePrice || kit.currentValue || 0);
      }
    }

    const topBrands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const allMonths = new Set([
      ...Object.keys(forSaleByMonth),
      ...Object.keys(soldByMonth),
    ]);
    const sortedMonths = Array.from(allMonths)
      .filter((m) => m !== "unknown")
      .sort();

    let accumulatedForSale = 0;
    const forSaleVsSoldByMonth = sortedMonths.map((month) => {
      accumulatedForSale += forSaleByMonth[month] || 0;
      accumulatedForSale -= soldByMonth[month] || 0;
      if (accumulatedForSale < 0) accumulatedForSale = 0;
      return {
        month,
        forSale: accumulatedForSale,
        sold: soldByMonth[month] || 0,
      };
    });

    return {
      kitsByStatus: Object.entries(kitsByStatus).map(([status, count]) => ({
        status,
        count,
      })),
      kitsByScale: Object.entries(kitsByScale).map(([scale, count]) => ({
        scale,
        count,
      })),
      kitsByCategory: Object.entries(kitsByCategory).map(
        ([category, count]) => ({ category, count }),
      ),
      topBrands,
      soldKitsCount,
      soldKitsValueByMonth: Object.entries(soldKitsValueByMonth)
        .map(([month, value]) => ({ month, value }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      totalSoldKitsValue,
      investmentByCategory: Object.entries(investmentByCategory).map(
        ([category, investment]) => ({ category, investment }),
      ),
      kitsForSaleCount,
      totalForSaleValue,
      forSaleVsSoldByMonth,
    };
  }

  async getFavoriteLinks(userId: string): Promise<FavoriteLink[]> {
    return db
      .select()
      .from(favoriteLinks)
      .where(eq(favoriteLinks.userId, userId))
      .orderBy(sql`created_at DESC`);
  }

  async createFavoriteLink(
    userId: string,
    link: InsertFavoriteLink,
  ): Promise<FavoriteLink> {
    const [newLink] = await db
      .insert(favoriteLinks)
      .values({ ...link, userId })
      .returning();
    return newLink;
  }

  async updateFavoriteLink(
    id: string,
    userId: string,
    link: Partial<InsertFavoriteLink>,
  ): Promise<FavoriteLink | undefined> {
    const [existing] = await db
      .select()
      .from(favoriteLinks)
      .where(and(eq(favoriteLinks.id, id), eq(favoriteLinks.userId, userId)));
    if (!existing) return undefined;
    const [updated] = await db
      .update(favoriteLinks)
      .set(link)
      .where(eq(favoriteLinks.id, id))
      .returning();
    return updated;
  }

  async deleteFavoriteLink(id: string, userId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(favoriteLinks)
      .where(and(eq(favoriteLinks.id, id), eq(favoriteLinks.userId, userId)));
    if (!existing) return false;
    await db.delete(favoriteLinks).where(eq(favoriteLinks.id, id));
    return true;
  }

  async getRssFeeds(userId: string): Promise<RssFeed[]> {
    return db
      .select()
      .from(rssFeeds)
      .where(eq(rssFeeds.userId, userId))
      .orderBy(sql`sort_order ASC, created_at DESC`);
  }

  async updateRssFeedsOrder(userId: string, feedIds: string[]): Promise<void> {
    for (let i = 0; i < feedIds.length; i++) {
      await db
        .update(rssFeeds)
        .set({ sortOrder: i })
        .where(and(eq(rssFeeds.id, feedIds[i]), eq(rssFeeds.userId, userId)));
    }
  }

  async getRssFeed(id: string, userId: string): Promise<RssFeed | undefined> {
    const [feed] = await db
      .select()
      .from(rssFeeds)
      .where(and(eq(rssFeeds.id, id), eq(rssFeeds.userId, userId)));
    return feed;
  }

  async createRssFeed(userId: string, feed: InsertRssFeed): Promise<RssFeed> {
    const [newFeed] = await db
      .insert(rssFeeds)
      .values({ ...feed, userId })
      .returning();
    return newFeed;
  }

  async updateRssFeed(
    id: string,
    data: Partial<RssFeed>,
  ): Promise<RssFeed | undefined> {
    const {
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      ...updateData
    } = data as any;
    const [updated] = await db
      .update(rssFeeds)
      .set(updateData)
      .where(eq(rssFeeds.id, id))
      .returning();
    return updated;
  }

  async deleteRssFeed(id: string, userId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(rssFeeds)
      .where(and(eq(rssFeeds.id, id), eq(rssFeeds.userId, userId)));
    if (!existing) return false;
    await db.delete(rssFeedItems).where(eq(rssFeedItems.feedId, id));
    await db.delete(rssFeeds).where(eq(rssFeeds.id, id));
    return true;
  }

  async getRssFeedItems(
    feedIds: string[],
    limit: number = 30,
  ): Promise<(RssFeedItem & { feedTitle: string })[]> {
    if (feedIds.length === 0) return [];
    const items = await db
      .select({
        id: rssFeedItems.id,
        feedId: rssFeedItems.feedId,
        guid: rssFeedItems.guid,
        title: rssFeedItems.title,
        link: rssFeedItems.link,
        publishedAt: rssFeedItems.publishedAt,
        excerpt: rssFeedItems.excerpt,
        imageUrl: rssFeedItems.imageUrl,
        createdAt: rssFeedItems.createdAt,
        feedTitle: rssFeeds.title,
      })
      .from(rssFeedItems)
      .innerJoin(rssFeeds, eq(rssFeedItems.feedId, rssFeeds.id))
      .where(
        sql`${rssFeedItems.feedId} IN (${sql.join(
          feedIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      )
      .orderBy(sql`${rssFeedItems.publishedAt} DESC NULLS LAST`)
      .limit(limit);
    return items;
  }

  async createRssFeedItem(item: InsertRssFeedItem): Promise<RssFeedItem> {
    const [newItem] = await db.insert(rssFeedItems).values(item).returning();
    return newItem;
  }

  async deleteOldRssFeedItems(
    feedId: string,
    keepCount: number,
  ): Promise<void> {
    const itemsToKeep = await db
      .select({ id: rssFeedItems.id })
      .from(rssFeedItems)
      .where(eq(rssFeedItems.feedId, feedId))
      .orderBy(sql`${rssFeedItems.publishedAt} DESC NULLS LAST`)
      .limit(keepCount);

    const keepIds = itemsToKeep.map((i) => i.id);
    if (keepIds.length > 0) {
      await db.delete(rssFeedItems).where(
        and(
          eq(rssFeedItems.feedId, feedId),
          sql`${rssFeedItems.id} NOT IN (${sql.join(
            keepIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
      );
    }
  }

  async getRssFeedItemByGuid(
    feedId: string,
    guid: string,
  ): Promise<RssFeedItem | undefined> {
    const [item] = await db
      .select()
      .from(rssFeedItems)
      .where(and(eq(rssFeedItems.feedId, feedId), eq(rssFeedItems.guid, guid)));
    return item;
  }

  async getMaterials(userId: string, type?: string): Promise<Material[]> {
    if (type) {
      return db
        .select()
        .from(materials)
        .where(and(eq(materials.userId, userId), eq(materials.type, type)));
    }
    return db.select().from(materials).where(eq(materials.userId, userId));
  }

  async getMaterial(id: string, userId: string): Promise<Material | undefined> {
    const [material] = await db
      .select()
      .from(materials)
      .where(and(eq(materials.id, id), eq(materials.userId, userId)));
    return material;
  }

  async getMaterialCountByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials)
      .where(eq(materials.userId, userId));
    return Number(result[0]?.count || 0);
  }

  async getPaintCountByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials)
      .where(and(eq(materials.userId, userId), eq(materials.type, "tintas")));
    return Number(result[0]?.count || 0);
  }

  async createMaterial(
    userId: string,
    material: InsertMaterial,
  ): Promise<Material> {
    const [newMaterial] = await db
      .insert(materials)
      .values({ ...material, userId })
      .returning();
    return newMaterial;
  }

  async updateMaterial(
    id: string,
    userId: string,
    material: Partial<InsertMaterial>,
  ): Promise<Material | undefined> {
    const existing = await this.getMaterial(id, userId);
    if (!existing) return undefined;

    const {
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      ...updateData
    } = material as any;

    const [updated] = await db
      .update(materials)
      .set(updateData)
      .where(eq(materials.id, id))
      .returning();
    return updated;
  }

  async deleteMaterial(id: string, userId: string): Promise<boolean> {
    const existing = await this.getMaterial(id, userId);
    if (!existing) return false;

    await db.delete(materials).where(eq(materials.id, id));
    return true;
  }

  async findPaintByBrandAndCode(
    userId: string,
    brand: string,
    code: string,
  ): Promise<Material | undefined> {
    const normalizedBrand = brand.toLowerCase().trim();
    const normalizedCode = code
      .toLowerCase()
      .trim()
      .replace(/[\s\-\.]/g, "");

    const userMaterials = await db
      .select()
      .from(materials)
      .where(and(eq(materials.userId, userId), eq(materials.type, "tintas")));

    const match = userMaterials.find((m) => {
      const mBrand = (m.brand || "").toLowerCase().trim();
      const mCode = (m.paintCode || "")
        .toLowerCase()
        .trim()
        .replace(/[\s\-\.]/g, "");
      return mBrand === normalizedBrand && mCode === normalizedCode;
    });

    return match;
  }

  async findMaterialByTypeAndName(
    userId: string,
    type: string,
    name: string,
    brand?: string,
  ): Promise<Material | undefined> {
    const normalizedName = name.toLowerCase().trim();
    const normalizedBrand = brand?.toLowerCase().trim();

    const userMaterials = await db
      .select()
      .from(materials)
      .where(and(eq(materials.userId, userId), eq(materials.type, type)));

    const match = userMaterials.find((m) => {
      const mName = (m.name || "").toLowerCase().trim();
      const mBrand = (m.brand || "").toLowerCase().trim();

      if (normalizedBrand) {
        return mName === normalizedName && mBrand === normalizedBrand;
      }
      return mName === normalizedName;
    });

    return match;
  }

  async findPaintByColorName(
    userId: string,
    colorName: string,
  ): Promise<Material | undefined> {
    const normalizedColor = colorName.toLowerCase().trim();

    const userMaterials = await db
      .select()
      .from(materials)
      .where(and(eq(materials.userId, userId), eq(materials.type, "tintas")));

    const match = userMaterials.find((m) => {
      const mColor = (m.paintColor || m.name || "").toLowerCase().trim();
      return mColor === normalizedColor;
    });

    return match;
  }

  async getPaintsByBrand(userId: string, brand: string): Promise<Material[]> {
    const normalizedBrand = brand.toLowerCase().trim();

    const userMaterials = await db
      .select()
      .from(materials)
      .where(and(eq(materials.userId, userId), eq(materials.type, "tintas")));

    return userMaterials.filter((m) => {
      const mBrand = (m.brand || "").toLowerCase().trim();
      return mBrand === normalizedBrand;
    });
  }

  async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    return db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId));
  }

  async getWishlistItem(
    id: string,
    userId: string,
  ): Promise<WishlistItem | undefined> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.id, id));
    if (item && item.userId === userId) {
      return item;
    }
    return undefined;
  }

  async getWishlistCountByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId));
    return Number(result[0]?.count) || 0;
  }

  async createWishlistItem(
    userId: string,
    item: InsertWishlistItem,
  ): Promise<WishlistItem> {
    const [newItem] = await db
      .insert(wishlistItems)
      .values({ ...item, userId })
      .returning();
    return newItem;
  }

  async updateWishlistItem(
    id: string,
    userId: string,
    item: Partial<InsertWishlistItem>,
  ): Promise<WishlistItem | undefined> {
    const existing = await this.getWishlistItem(id, userId);
    if (!existing) return undefined;

    const {
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      ...updateData
    } = item as any;

    const [updated] = await db
      .update(wishlistItems)
      .set(updateData)
      .where(eq(wishlistItems.id, id))
      .returning();
    return updated;
  }

  async deleteWishlistItem(id: string, userId: string): Promise<boolean> {
    const existing = await this.getWishlistItem(id, userId);
    if (!existing) return false;

    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
    return true;
  }

  async getTotalItemCount(userId: string): Promise<number> {
    const [kitsCount, materialsCount, wishlistCount] = await Promise.all([
      this.getKitCountByUser(userId),
      this.getMaterialCountByUser(userId),
      this.getWishlistCountByUser(userId),
    ]);
    return kitsCount + materialsCount + wishlistCount;
  }

  async getAdminMetrics(
    startDate?: Date,
    endDate?: Date,
    freeLimit: number = 10,
  ): Promise<AdminMetrics> {
    const now = new Date();
    const effectiveEndDate = endDate || now;

    const userDateConditions = [];
    const kitDateConditions = [];

    if (startDate) {
      userDateConditions.push(sql`${users.createdAt} >= ${startDate}`);
      kitDateConditions.push(sql`${kits.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      userDateConditions.push(sql`${users.createdAt} <= ${effectiveEndDate}`);
      kitDateConditions.push(sql`${kits.createdAt} <= ${effectiveEndDate}`);
    }

    const nonAdminCondition = sql`${users.isAdmin} = false`;
    const notExcludedCondition = sql`${users.excludeFromMetrics} = false`;

    // Count excluded users (for reporting)
    const excludedUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          sql`${users.excludeFromMetrics} = true`,
          ...userDateConditions,
        ),
      );
    const excludedUsersCount = Number(excludedUsersResult[0]?.count) || 0;

    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(nonAdminCondition, notExcludedCondition, ...userDateConditions),
      );
    const totalUsers = Number(totalUsersResult[0]?.count) || 0;

    const nonAdminUserIds = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(nonAdminCondition, notExcludedCondition, ...userDateConditions),
      );
    const userIds = nonAdminUserIds.map((u) => u.id);

    if (userIds.length === 0) {
      return {
        totalUsers: 0,
        totalKits: 0,
        averageKitsPerUser: 0,
        usersWithAtLeastOneKit: 0,
        usersWithTwoOrMoreKits: 0,
        averageHoursToFirstKit: 0,
        usersAtFreeLimit: 0,
        excludedUsersCount,
        totalMaterials: 0,
        totalItems: 0,
        averageItemsPerUser: 0,
        usersWithNoItems: 0,
        usersActive7Days: 0,
        usersActive30Days: 0,
        paidUsersCount: 0,
        conversionRate: 0,
        iaUsersCount: 0,
        iaUsersNeverUsedCount: 0,
        iaUsersNeverUsedPercentage: 0,
        iaActionsTotal: 0,
        iaActionsPerUserAverage: 0,
        iaUsageDistribution: {
          oneAction: 0,
          twoToFiveActions: 0,
          sixToTwentyActions: 0,
          moreThanTwentyActions: 0,
        },
        paidUsersIaCount: 0,
        paidUsersIaPercentage: 0,
        iaActionsPerPaidUserAverage: 0,
        avgDaysToTenItems: 0,
        usersWithTenOrMoreItems: 0,
        usersWithExactlyOneItem: 0,
        signupsBR: 0,
        signupsES: 0,
        signupsPT: 0,
        presenceD1Rate: 0,
        presenceD1UsersReturned: 0,
        presenceD1UsersTotal: 0,
        streakRitualRate: 0,
        streakRitualUsers: 0,
        streakRitualActiveWeekUsers: 0,
        spontaneousActionRate: 0,
        spontaneousActionUsers: 0,
        spontaneousActionTotalActive: 0,
      };
    }

    const kitConditions = [
      sql`${kits.userId} = ANY(ARRAY[${sql.join(
        userIds.map((id) => sql`${id}`),
        sql`, `,
      )}]::varchar[])`,
      ...kitDateConditions,
    ];

    const totalKitsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(kits)
      .where(and(...kitConditions));
    const totalKits = Number(totalKitsResult[0]?.count) || 0;

    const averageKitsPerUser =
      totalUsers > 0 ? Number((totalKits / totalUsers).toFixed(2)) : 0;

    const kitCountsByUser = await db
      .select({
        userId: kits.userId,
        count: sql<number>`count(*)`,
      })
      .from(kits)
      .where(and(...kitConditions))
      .groupBy(kits.userId);

    const usersWithAtLeastOneKit = kitCountsByUser.filter(
      (u) => Number(u.count) >= 1,
    ).length;
    const usersWithTwoOrMoreKits = kitCountsByUser.filter(
      (u) => Number(u.count) >= 2,
    ).length;
    const usersWithExactlyOneKit = kitCountsByUser.filter(
      (u) => Number(u.count) === 1,
    ).length;

    // Count total items (kits + materials) per user to check free limit
    const materialCountsByUser = await db
      .select({
        userId: materials.userId,
        count: sql<number>`count(*)`,
      })
      .from(materials)
      .where(
        sql`${materials.userId} = ANY(ARRAY[${sql.join(
          userIds.map((id) => sql`${id}`),
          sql`, `,
        )}]::varchar[])`,
      )
      .groupBy(materials.userId);

    // Get paid user IDs to exclude from free limit calculation
    const paidUsersForFreeLimitResult = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          sql`${users.status} = 'pago'`,
          ...userDateConditions,
        ),
      );
    const paidUsersForFreeLimitSet = new Set(
      paidUsersForFreeLimitResult.map((u) => u.id),
    );

    // Combine kit counts and material counts per user
    const totalItemsByUser = new Map<string, number>();
    for (const kit of kitCountsByUser) {
      totalItemsByUser.set(kit.userId, Number(kit.count));
    }
    for (const mat of materialCountsByUser) {
      const current = totalItemsByUser.get(mat.userId) || 0;
      totalItemsByUser.set(mat.userId, current + Number(mat.count));
    }

    // Count users at free limit, excluding paid users
    const usersAtFreeLimit = Array.from(totalItemsByUser.entries()).filter(
      ([userId, count]) =>
        count >= freeLimit && !paidUsersForFreeLimitSet.has(userId),
    ).length;

    // Calculate total materials
    const totalMaterialsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials)
      .where(
        sql`${materials.userId} = ANY(ARRAY[${sql.join(
          userIds.map((id) => sql`${id}`),
          sql`, `,
        )}]::varchar[])`,
      );
    const totalMaterials = Number(totalMaterialsResult[0]?.count) || 0;

    // Total items = kits + materials
    const totalItems = totalKits + totalMaterials;
    const averageItemsPerUser =
      totalUsers > 0 ? Number((totalItems / totalUsers).toFixed(2)) : 0;

    // Users with no items (no kits and no materials)
    const usersWithItems = new Set([
      ...kitCountsByUser.map((k) => k.userId),
      ...materialCountsByUser.map((m) => m.userId),
    ]);
    const usersWithNoItems = totalUsers - usersWithItems.size;

    // Active users (last 7 days and 30 days) based on lastLogin
    const currentDate = new Date();
    const sevenDaysAgo = new Date(
      currentDate.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000,
    );

    const active7DaysResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          sql`${users.lastLogin} >= ${sevenDaysAgo.toISOString()}`,
        ),
      );
    const usersActive7Days = Number(active7DaysResult[0]?.count) || 0;

    const active30DaysResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          sql`${users.lastLogin} >= ${thirtyDaysAgo.toISOString()}`,
        ),
      );
    const usersActive30Days = Number(active30DaysResult[0]?.count) || 0;

    // Paid users count and conversion rate
    const paidUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          sql`${users.status} = 'pago'`,
          ...userDateConditions,
        ),
      );
    const paidUsersCount = Number(paidUsersResult[0]?.count) || 0;
    const conversionRate =
      totalUsers > 0
        ? Number(((paidUsersCount / totalUsers) * 100).toFixed(2))
        : 0;

    const firstKitDatesResult = await db
      .select({
        userId: kits.userId,
        firstKitDate: sql<Date>`MIN(${kits.createdAt})`,
      })
      .from(kits)
      .where(and(...kitConditions))
      .groupBy(kits.userId);

    const usersWithFirstKit = await db
      .select({ id: users.id, createdAt: users.createdAt })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          ...userDateConditions,
          sql`${users.id} = ANY(ARRAY[${sql.join(
            firstKitDatesResult.map((r) => sql`${r.userId}`),
            sql`, `,
          )}]::varchar[])`,
        ),
      );

    let totalHoursToFirstKit = 0;
    let usersWithKitCount = 0;

    for (const user of usersWithFirstKit) {
      const firstKitData = firstKitDatesResult.find(
        (r) => r.userId === user.id,
      );
      if (firstKitData && firstKitData.firstKitDate && user.createdAt) {
        const userCreatedAt = new Date(user.createdAt);
        const firstKitDate = new Date(firstKitData.firstKitDate);
        const hoursDiff =
          (firstKitDate.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60);
        totalHoursToFirstKit += Math.max(0, hoursDiff);
        usersWithKitCount++;
      }
    }

    const averageHoursToFirstKit =
      usersWithKitCount > 0
        ? Number((totalHoursToFirstKit / usersWithKitCount).toFixed(1))
        : 0;

    // ========== IA METRICS ==========
    const iaDateConditions = [];
    if (startDate) {
      iaDateConditions.push(sql`${iaActions.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      iaDateConditions.push(sql`${iaActions.createdAt} <= ${effectiveEndDate}`);
    }

    const iaConditions = [
      sql`${iaActions.userId} = ANY(ARRAY[${sql.join(
        userIds.map((id) => sql`${id}`),
        sql`, `,
      )}]::varchar[])`,
      ...iaDateConditions,
    ];

    // Total IA actions by non-admin users
    const iaActionsTotalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(iaActions)
      .where(and(...iaConditions));
    const iaActionsTotal = Number(iaActionsTotalResult[0]?.count) || 0;

    // IA actions count per user
    const iaCountsByUser = await db
      .select({
        userId: iaActions.userId,
        count: sql<number>`count(*)`,
      })
      .from(iaActions)
      .where(and(...iaConditions))
      .groupBy(iaActions.userId);

    const iaUsersCount = iaCountsByUser.length;
    const iaUsersNeverUsedCount = totalUsers - iaUsersCount;
    const iaUsersNeverUsedPercentage =
      totalUsers > 0
        ? Number(((iaUsersNeverUsedCount / totalUsers) * 100).toFixed(1))
        : 0;
    const iaActionsPerUserAverage =
      iaUsersCount > 0 ? Number((iaActionsTotal / iaUsersCount).toFixed(2)) : 0;

    // IA usage distribution
    const iaUsageDistribution = {
      oneAction: iaCountsByUser.filter((u) => Number(u.count) === 1).length,
      twoToFiveActions: iaCountsByUser.filter(
        (u) => Number(u.count) >= 2 && Number(u.count) <= 5,
      ).length,
      sixToTwentyActions: iaCountsByUser.filter(
        (u) => Number(u.count) >= 6 && Number(u.count) <= 20,
      ).length,
      moreThanTwentyActions: iaCountsByUser.filter((u) => Number(u.count) > 20)
        .length,
    };

    // Paid users IA metrics
    const paidUserIdsResult = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          sql`${users.status} = 'pago'`,
          ...userDateConditions,
        ),
      );
    const paidUserIds = paidUserIdsResult.map((u) => u.id);
    const totalPaidUsers = paidUserIds.length;

    let paidUsersIaCount = 0;
    let paidUsersIaActionsTotal = 0;

    if (paidUserIds.length > 0) {
      const paidIaConditions = [
        sql`${iaActions.userId} = ANY(ARRAY[${sql.join(
          paidUserIds.map((id) => sql`${id}`),
          sql`, `,
        )}]::varchar[])`,
        ...iaDateConditions,
      ];

      const paidIaCountsByUser = await db
        .select({
          userId: iaActions.userId,
          count: sql<number>`count(*)`,
        })
        .from(iaActions)
        .where(and(...paidIaConditions))
        .groupBy(iaActions.userId);

      paidUsersIaCount = paidIaCountsByUser.length;
      paidUsersIaActionsTotal = paidIaCountsByUser.reduce(
        (sum, u) => sum + Number(u.count),
        0,
      );
    }

    const paidUsersIaPercentage =
      totalPaidUsers > 0
        ? Number(((paidUsersIaCount / totalPaidUsers) * 100).toFixed(1))
        : 0;
    const iaActionsPerPaidUserAverage =
      paidUsersIaCount > 0
        ? Number((paidUsersIaActionsTotal / paidUsersIaCount).toFixed(2))
        : 0;

    // ========== ACTIVATION METRICS (10 ITEMS) ==========
    // Calculate time to reach 10 items for each user
    // Get all users with their creation date
    const usersWithCreatedAt = await db
      .select({ id: users.id, createdAt: users.createdAt })
      .from(users)
      .where(
        and(nonAdminCondition, notExcludedCondition, ...userDateConditions),
      );

    // Count users who have reached 10+ items
    const usersWithTenOrMoreItems = Array.from(
      totalItemsByUser.entries(),
    ).filter(([_, count]) => count >= 10).length;

    // For users with 10+ items, calculate when they reached the 10th item
    // We need to find the timestamp of the 10th item for each qualifying user
    let totalDaysToTenItems = 0;
    let usersReachedTen = 0;

    for (const [userId, itemCount] of Array.from(totalItemsByUser.entries())) {
      if (itemCount >= 10) {
        const userInfo = usersWithCreatedAt.find((u) => u.id === userId);
        if (!userInfo || !userInfo.createdAt) continue;

        // Get all item creation timestamps for this user (kits + materials)
        const userKits = await db
          .select({ createdAt: kits.createdAt })
          .from(kits)
          .where(eq(kits.userId, userId));

        const userMaterials = await db
          .select({ createdAt: materials.createdAt })
          .from(materials)
          .where(eq(materials.userId, userId));

        // Combine and sort all item timestamps
        const allItemDates = [
          ...userKits.map((k) => k.createdAt),
          ...userMaterials.map((m) => m.createdAt),
        ]
          .filter((d) => d !== null)
          .sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime());

        // Get the 10th item timestamp (index 9)
        if (allItemDates.length >= 10) {
          const tenthItemDate = new Date(allItemDates[9]!);
          const userCreatedAt = new Date(userInfo.createdAt);
          const daysDiff =
            (tenthItemDate.getTime() - userCreatedAt.getTime()) /
            (1000 * 60 * 60 * 24);
          totalDaysToTenItems += Math.max(0, daysDiff);
          usersReachedTen++;
        }
      }
    }

    const avgDaysToTenItems =
      usersReachedTen > 0
        ? Number((totalDaysToTenItems / usersReachedTen).toFixed(1))
        : 0;

    // Country signups (respects period filter)
    const signupsBRResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          eq(users.country, "BR"),
          ...userDateConditions,
        ),
      );
    const signupsBR = Number(signupsBRResult[0]?.count) || 0;

    const signupsESResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          eq(users.country, "ES"),
          ...userDateConditions,
        ),
      );
    const signupsES = Number(signupsESResult[0]?.count) || 0;

    const signupsPTResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          eq(users.country, "PT"),
          ...userDateConditions,
        ),
      );
    const signupsPT = Number(signupsPTResult[0]?.count) || 0;

    // ========== PRESENCE D+1 RETENTION ==========
    // Users who returned on the day after signup (D+1)
    // Presence D+1 = Users who accessed on D+1 / Users who signed up on D0
    // We check if lastLogin date is >= D+1 (day after createdAt)
    const usersWithLoginInfo = await db
      .select({
        id: users.id,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .where(
        and(
          nonAdminCondition,
          notExcludedCondition,
          isNotNull(users.lastLogin),
          ...userDateConditions,
        ),
      );

    // Only count users who had time to return (created at least 1 day ago)
    const currentTime = new Date();
    const oneDayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

    let presenceD1UsersTotal = 0;
    let presenceD1UsersReturned = 0;

    for (const u of usersWithLoginInfo) {
      if (!u.createdAt) continue;
      const createdAt = new Date(u.createdAt);

      // Only count users who signed up at least 1 day ago
      if (createdAt > oneDayAgo) continue;

      presenceD1UsersTotal++;

      if (u.lastLogin) {
        const lastLogin = new Date(u.lastLogin);
        // D+1 = day after signup
        const d1Start = new Date(createdAt);
        d1Start.setDate(d1Start.getDate() + 1);
        d1Start.setHours(0, 0, 0, 0);

        // User returned if they logged in on or after D+1
        if (lastLogin >= d1Start) {
          presenceD1UsersReturned++;
        }
      }
    }

    const presenceD1Rate =
      presenceD1UsersTotal > 0
        ? Number(
            ((presenceD1UsersReturned / presenceD1UsersTotal) * 100).toFixed(1),
          )
        : 0;

    // ========== STREAK ≥3 DAYS (RITUAL INSTALLED) ==========
    // Users who returned 3+ different days within a 7-day window
    // Streak ≥3 = Users with presence in ≥3 distinct days / Users active in the week
    const streakWindowStart = new Date(
      currentTime.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const streakWindowStartStr = streakWindowStart.toISOString().split("T")[0];

    // Get all session logs from last 7 days grouped by user
    const sessionLogsLast7Days = await db
      .select({
        userId: workbenchSessionLog.userId,
        sessionDate: workbenchSessionLog.sessionDate,
      })
      .from(workbenchSessionLog)
      .where(gte(workbenchSessionLog.sessionDate, streakWindowStartStr));

    // Count distinct days per user in last 7 days
    const userSessionDays: Record<string, Set<string>> = {};
    for (const log of sessionLogsLast7Days) {
      if (!userSessionDays[log.userId]) {
        userSessionDays[log.userId] = new Set();
      }
      userSessionDays[log.userId].add(log.sessionDate);
    }

    // Count users with ≥1 session (active in week) and ≥3 distinct days (ritual installed)
    const activeWeekUserIds = Object.keys(userSessionDays);
    const streakRitualActiveWeekUsers = activeWeekUserIds.length;
    const streakRitualUsers = activeWeekUserIds.filter(
      (userId) => userSessionDays[userId].size >= 3,
    ).length;

    const streakRitualRate =
      streakRitualActiveWeekUsers > 0
        ? Number(
            ((streakRitualUsers / streakRitualActiveWeekUsers) * 100).toFixed(
              1,
            ),
          )
        : 0;

    // ========== SPONTANEOUS ACTION (WITHOUT NUDGE) ==========
    // Users who created item without modal/email nudge in the last 24h before
    // Spontaneous = Users who created item WITHOUT prior nudge / Active users with items
    const nudgeEvents = [
      "welcome_modal_shown",
      "welcome_modal_cta_clicked",
      "nudge_email_sent",
    ];
    const nudgeWindowHours = 24;

    // Get all users with at least 1 item
    const usersWithItemsIds = kitCountsByUser
      .filter((u) => Number(u.count) >= 1)
      .map((u) => u.userId);

    // For each user, check if their first item was created without a prior nudge
    let spontaneousActionUsers = 0;

    for (const userId of usersWithItemsIds) {
      // Get user's first kit creation time
      const userFirstKit = await db
        .select({ createdAt: kits.createdAt })
        .from(kits)
        .where(eq(kits.userId, userId))
        .orderBy(kits.createdAt)
        .limit(1);

      if (!userFirstKit[0]?.createdAt) continue;

      const firstKitTime = new Date(userFirstKit[0].createdAt);
      const nudgeWindowStart = new Date(
        firstKitTime.getTime() - nudgeWindowHours * 60 * 60 * 1000,
      );

      // Check if user had any nudge in the window before first item
      const nudgeBeforeItem = await db
        .select({ id: userEvents.id })
        .from(userEvents)
        .where(
          and(
            eq(userEvents.userId, userId),
            sql`${userEvents.eventName} = ANY(ARRAY[${sql.join(
              nudgeEvents.map((e) => sql`${e}`),
              sql`, `,
            )}]::text[])`,
            gte(userEvents.createdAt, nudgeWindowStart),
            lte(userEvents.createdAt, firstKitTime),
          ),
        )
        .limit(1);

      // If no nudge before first item, it's spontaneous
      if (nudgeBeforeItem.length === 0) {
        spontaneousActionUsers++;
      }
    }

    const spontaneousActionTotalActive = usersWithItemsIds.length;
    const spontaneousActionRate =
      spontaneousActionTotalActive > 0
        ? Number(
            (
              (spontaneousActionUsers / spontaneousActionTotalActive) *
              100
            ).toFixed(1),
          )
        : 0;

    return {
      totalUsers,
      totalKits,
      averageKitsPerUser,
      usersWithAtLeastOneKit,
      usersWithTwoOrMoreKits,
      averageHoursToFirstKit,
      usersAtFreeLimit,
      excludedUsersCount,
      totalMaterials,
      totalItems,
      averageItemsPerUser,
      usersWithNoItems,
      usersActive7Days,
      usersActive30Days,
      paidUsersCount,
      conversionRate,
      iaUsersCount,
      iaUsersNeverUsedCount,
      iaUsersNeverUsedPercentage,
      iaActionsTotal,
      iaActionsPerUserAverage,
      iaUsageDistribution,
      paidUsersIaCount,
      paidUsersIaPercentage,
      iaActionsPerPaidUserAverage,
      avgDaysToTenItems,
      usersWithTenOrMoreItems,
      usersWithExactlyOneItem: usersWithExactlyOneKit,
      signupsBR,
      signupsES,
      signupsPT,
      presenceD1Rate,
      presenceD1UsersReturned,
      presenceD1UsersTotal,
      streakRitualRate,
      streakRitualUsers,
      streakRitualActiveWeekUsers,
      spontaneousActionRate,
      spontaneousActionUsers,
      spontaneousActionTotalActive,
    };
  }

  async logIaAction(
    userId: string,
    actionType: string,
    metadata?: Record<string, unknown>,
  ): Promise<IaAction> {
    const [action] = await db
      .insert(iaActions)
      .values({ userId, actionType, metadata })
      .returning();
    return action;
  }

  async getIaActionsByUser(userId: string): Promise<IaAction[]> {
    return await db
      .select()
      .from(iaActions)
      .where(eq(iaActions.userId, userId));
  }

  async getAdminSetting(key: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key));
    return setting?.value ?? null;
  }

  async setAdminSetting(key: string, value: string): Promise<void> {
    await db
      .insert(adminSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  async getAllAdminSettings(): Promise<Record<string, string>> {
    const settings = await db.select().from(adminSettings);
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  async updateUserExcludeFromMetrics(
    userId: string,
    excludeFromMetrics: boolean,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ excludeFromMetrics })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getExcludedFromMetricsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.excludeFromMetrics, true));
    return Number(result[0]?.count) || 0;
  }

  async getUsersForFollowUpEmails(): Promise<{
    email24h: User[];
    email4d: User[];
    email10d: User[];
  }> {
    const now = new Date();
    const hours24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const days4Ago = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const days10Ago = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    // Single efficient query: get users with 0 kits using left join and group by
    const usersWithKitCounts = await db
      .select({
        user: users,
        kitCount: sql<number>`COALESCE(COUNT(${kits.id}), 0)::int`,
      })
      .from(users)
      .leftJoin(kits, eq(users.id, kits.userId))
      .groupBy(users.id);

    const email24h: User[] = [];
    const email4d: User[] = [];
    const email10d: User[] = [];

    for (const { user, kitCount } of usersWithKitCounts) {
      // Skip users who have kits
      if (kitCount > 0) continue;

      const createdAt = new Date(user.createdAt);

      // 24h email: registered 24h-4d ago, email not sent yet
      if (
        !user.followUpEmail24hSent &&
        createdAt <= hours24Ago &&
        createdAt > days4Ago
      ) {
        email24h.push(user);
      }

      // 4d email: registered 4d-10d ago, email not sent yet
      if (
        !user.followUpEmail4dSent &&
        createdAt <= days4Ago &&
        createdAt > days10Ago
      ) {
        email4d.push(user);
      }

      // 10d email: registered 10d+ ago, email not sent yet
      if (!user.followUpEmail10dSent && createdAt <= days10Ago) {
        email10d.push(user);
      }
    }

    return { email24h, email4d, email10d };
  }

  async markFollowUpEmailSent(
    userId: string,
    emailType: "24h" | "4d" | "10d",
  ): Promise<void> {
    const updateData: Record<string, boolean> = {};

    if (emailType === "24h") {
      updateData.followUpEmail24hSent = true;
    } else if (emailType === "4d") {
      updateData.followUpEmail4dSent = true;
    } else if (emailType === "10d") {
      updateData.followUpEmail10dSent = true;
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    // Log nudge event for spontaneous action tracking
    await this.logUserEvent(userId, "nudge_email_sent", { emailType });
  }

  async getUsersFor30dInactivityEmail(): Promise<User[]> {
    const now = new Date();
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const allUsers = await db.select().from(users);
    const result: User[] = [];

    for (const user of allUsers) {
      if (user.followUpEmail30dInactiveSent) continue;

      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      if (!lastLogin) continue;

      if (lastLogin <= days30Ago) {
        result.push(user);
      }
    }

    return result;
  }

  async mark30dInactivityEmailSent(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ followUpEmail30dInactiveSent: true })
      .where(eq(users.id, userId));

    await this.logUserEvent(userId, "nudge_email_sent", { emailType: "30d_inactive" });
  }

  async markLimitReachedEmailSent(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ limitReachedEmailSent: true })
      .where(eq(users.id, userId));
  }

  async getGamificationStatus(userId: string): Promise<{
    totalItems: number;
    currentLevel: number;
    currentLevelName: string;
    nextLevelItemsRequired: number | null;
    itemsToNextLevel: number | null;
    progressPercent: number;
    isMaxLevel: boolean;
    newLevelUnlocked: number | null;
  }> {
    const LEVELS = [
      { level: 1, name: "Iniciante", itemsRequired: 1 },
      { level: 2, name: "Bronze", itemsRequired: 8 },
      { level: 3, name: "Prata", itemsRequired: 20 },
      { level: 4, name: "Ouro", itemsRequired: 50 },
      { level: 5, name: "Diamante", itemsRequired: 100 },
    ];

    const kitCount = await this.getKitCountByUser(userId);
    const materialCount = await this.getMaterialCountByUser(userId);
    const totalItems = kitCount + materialCount;

    const user = await this.getUser(userId);
    const previousLevel = user?.gamificationLevel || 0;
    const levelsUnlocked = user?.levelsUnlocked || [];

    let currentLevel = 0;
    let currentLevelName = "";

    for (const lvl of LEVELS) {
      if (totalItems >= lvl.itemsRequired) {
        currentLevel = lvl.level;
        currentLevelName = lvl.name;
      }
    }

    const currentLevelData = LEVELS.find((l) => l.level === currentLevel);
    const nextLevelData = LEVELS.find((l) => l.level === currentLevel + 1);

    const isMaxLevel = currentLevel === 5;
    const nextLevelItemsRequired = nextLevelData?.itemsRequired || null;
    const itemsToNextLevel = nextLevelItemsRequired
      ? nextLevelItemsRequired - totalItems
      : null;

    let progressPercent = 0;
    if (!isMaxLevel && currentLevelData && nextLevelData) {
      const itemsInCurrentLevel = totalItems - currentLevelData.itemsRequired;
      const itemsNeededForNext =
        nextLevelData.itemsRequired - currentLevelData.itemsRequired;
      progressPercent = Math.min(
        100,
        Math.round((itemsInCurrentLevel / itemsNeededForNext) * 100),
      );
    } else if (isMaxLevel) {
      progressPercent = 100;
    }

    let newLevelUnlocked: number | null = null;
    if (currentLevel > previousLevel && currentLevel > 0) {
      const levelKey = `level_${currentLevel}`;
      if (!levelsUnlocked.includes(levelKey)) {
        newLevelUnlocked = currentLevel;
        const newLevelsUnlocked = [...levelsUnlocked, levelKey];
        await db
          .update(users)
          .set({
            gamificationLevel: currentLevel,
            levelsUnlocked: newLevelsUnlocked,
          })
          .where(eq(users.id, userId));
      }
    } else if (currentLevel > 0 && previousLevel === 0) {
      await db
        .update(users)
        .set({ gamificationLevel: currentLevel })
        .where(eq(users.id, userId));
    }

    return {
      totalItems,
      currentLevel,
      currentLevelName,
      nextLevelItemsRequired,
      itemsToNextLevel,
      progressPercent,
      isMaxLevel,
      newLevelUnlocked,
    };
  }

  async updateGamificationLevelRetroactive(userId: string): Promise<void> {
    const LEVELS = [
      { level: 1, name: "Iniciante", itemsRequired: 1 },
      { level: 2, name: "Bronze", itemsRequired: 8 },
      { level: 3, name: "Prata", itemsRequired: 20 },
      { level: 4, name: "Ouro", itemsRequired: 50 },
      { level: 5, name: "Diamante", itemsRequired: 100 },
    ];

    const kitCount = await this.getKitCountByUser(userId);
    const materialCount = await this.getMaterialCountByUser(userId);
    const totalItems = kitCount + materialCount;

    let currentLevel = 0;
    for (const lvl of LEVELS) {
      if (totalItems >= lvl.itemsRequired) {
        currentLevel = lvl.level;
      }
    }

    const user = await this.getUser(userId);
    if (user && user.gamificationLevel < currentLevel) {
      const levelsUnlocked = [];
      for (let i = 1; i <= currentLevel; i++) {
        levelsUnlocked.push(`level_${i}`);
      }
      await db
        .update(users)
        .set({
          gamificationLevel: currentLevel,
          levelsUnlocked: levelsUnlocked,
        })
        .where(eq(users.id, userId));
    }
  }

  async acknowledgeLevelUp(userId: string, level: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const levelKey = `level_${level}`;
    const currentLevelsUnlocked = user.levelsUnlocked || [];

    if (!currentLevelsUnlocked.includes(levelKey)) {
      const newLevelsUnlocked = [...currentLevelsUnlocked, levelKey];
      await db
        .update(users)
        .set({
          gamificationLevel: Math.max(user.gamificationLevel, level),
          levelsUnlocked: newLevelsUnlocked,
        })
        .where(eq(users.id, userId));
    }
  }

  async markFirstKitCompleted(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ hasCompletedFirstKit: true })
      .where(eq(users.id, userId));
  }

  async updateWorkbenchSession(
    userId: string,
    workbenchDays: number,
    lastSessionDate: string,
  ): Promise<void> {
    await db
      .update(users)
      .set({
        workbenchDays,
        lastWorkbenchSessionDate: lastSessionDate,
      })
      .where(eq(users.id, userId));

    // Also log to session history for streak tracking
    await db.insert(workbenchSessionLog).values({
      userId,
      sessionDate: lastSessionDate,
    });
  }

  async logUserEvent(
    userId: string,
    eventName: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await db.insert(userEvents).values({
      userId,
      eventName,
      metadata: metadata || null,
    });
  }

  async hasUserEvent(userId: string, eventName: string): Promise<boolean> {
    const [event] = await db
      .select()
      .from(userEvents)
      .where(
        and(eq(userEvents.userId, userId), eq(userEvents.eventName, eventName)),
      );
    return !!event;
  }

  async getFunnelData(
    startDate?: string,
    endDate?: string,
    registrationLanguage?: string,
    country?: string,
  ): Promise<{ eventName: string; count: number }[]> {
    const conditions = [eq(users.excludeFromMetrics, false)];

    // Parse dates as São Paulo timezone (UTC-3)
    if (startDate) {
      const startDateObj = new Date(`${startDate}T00:00:00-03:00`);
      conditions.push(gte(userEvents.createdAt, startDateObj));
    }
    if (endDate) {
      const endDateObj = new Date(`${endDate}T23:59:59.999-03:00`);
      conditions.push(lte(userEvents.createdAt, endDateObj));
    }

    // Filter by registrationLanguage if specified
    if (registrationLanguage) {
      conditions.push(eq(users.registrationLanguage, registrationLanguage));
    }

    // Filter by country if specified
    if (country) {
      conditions.push(eq(users.country, country));
    }

    const result = await db
      .select({
        eventName: userEvents.eventName,
        count: sql<number>`count(distinct ${userEvents.userId})::int`,
      })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(and(...conditions))
      .groupBy(userEvents.eventName);
    return result;
  }

  async backfillFunnelEvents(): Promise<{
    signups: number;
    kit1: number;
    kit3: number;
    kit5: number;
    kit7: number;
    kit10: number;
    upgrades: number;
  }> {
    const results = {
      signups: 0,
      kit1: 0,
      kit3: 0,
      kit5: 0,
      kit7: 0,
      kit10: 0,
      upgrades: 0,
    };

    // Get all users who should be tracked
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.excludeFromMetrics, false));

    for (const user of allUsers) {
      // Count total items (kits + materials)
      const [kitCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(kits)
        .where(eq(kits.userId, user.id));
      const [matCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(materials)
        .where(eq(materials.userId, user.id));
      const totalItems =
        (kitCountResult?.count || 0) + (matCountResult?.count || 0);

      // Check and create sign_up event
      const hasSignUp = await this.hasUserEvent(user.id, "sign_up");
      if (!hasSignUp) {
        await db.insert(userEvents).values({
          userId: user.id,
          eventName: "sign_up",
          createdAt: user.createdAt,
        });
        results.signups++;
      }

      // Create milestone events based on total items
      const milestones = [
        {
          count: 1,
          event: "kit_created_1",
          legacy: "item_created_1",
          key: "kit1" as const,
        },
        {
          count: 3,
          event: "kit_created_3",
          legacy: "item_created_3",
          key: "kit3" as const,
        },
        {
          count: 5,
          event: "kit_created_5",
          legacy: "item_created_5",
          key: "kit5" as const,
        },
        {
          count: 7,
          event: "kit_created_7",
          legacy: null,
          key: "kit7" as const,
        },
        {
          count: 10,
          event: "kit_created_10",
          legacy: "item_created_10",
          key: "kit10" as const,
        },
      ];

      for (const m of milestones) {
        if (totalItems >= m.count) {
          const hasNew = await this.hasUserEvent(user.id, m.event);
          const hasLegacy = m.legacy
            ? await this.hasUserEvent(user.id, m.legacy)
            : false;
          if (!hasNew && !hasLegacy) {
            await db.insert(userEvents).values({
              userId: user.id,
              eventName: m.event,
              createdAt: new Date(user.createdAt.getTime() + m.count * 3600000),
            });
            results[m.key]++;
          }
        }
      }

      // Check and create upgrade_pro event for paid users
      if (user.status === "pago") {
        const hasUpgrade = await this.hasUserEvent(user.id, "upgrade_pro");
        if (!hasUpgrade) {
          await db.insert(userEvents).values({
            userId: user.id,
            eventName: "upgrade_pro",
            createdAt: new Date(user.createdAt.getTime() + 86400000),
          });
          results.upgrades++;
        }
      }
    }

    return results;
  }

  async getUpgradeClicksInPeriod(
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    // If no period filter, use the upgradeClickCount column from users table (historical data)
    if (!startDate && !endDate) {
      const [result] = await db
        .select({
          count: sql<number>`COALESCE(SUM(upgrade_click_count), 0)::int`,
        })
        .from(users)
        .where(eq(users.excludeFromMetrics, false));
      return result?.count || 0;
    }

    // For period-filtered queries, use the user_events table
    const conditions = [
      eq(userEvents.eventName, "upgrade_button_click"),
      eq(users.excludeFromMetrics, false),
    ];

    // Parse dates as São Paulo timezone (UTC-3)
    if (startDate) {
      const start = new Date(`${startDate}T00:00:00-03:00`);
      conditions.push(gte(userEvents.createdAt, start));
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999-03:00`);
      conditions.push(lte(userEvents.createdAt, end));
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(and(...conditions));

    return result?.count || 0;
  }

  async getWelcomeModalStats(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    shown: number;
    ctaClicked: number;
    closedWithoutAction: number;
    es: { shown: number; ctaClicked: number; closedWithoutAction: number };
    pt: { shown: number; ctaClicked: number; closedWithoutAction: number };
    br: { shown: number; ctaClicked: number; closedWithoutAction: number };
  }> {
    const dateConditions: any[] = [];
    if (startDate) {
      const start = new Date(`${startDate}T00:00:00-03:00`);
      dateConditions.push(gte(userEvents.createdAt, start));
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999-03:00`);
      dateConditions.push(lte(userEvents.createdAt, end));
    }

    // Overall stats
    const [shownResult] = await db
      .select({ count: sql<number>`count(DISTINCT user_id)::int` })
      .from(userEvents)
      .where(
        and(eq(userEvents.eventName, "welcome_modal_shown"), ...dateConditions),
      );

    const [ctaResult] = await db
      .select({ count: sql<number>`count(DISTINCT user_id)::int` })
      .from(userEvents)
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_cta_clicked"),
          ...dateConditions,
        ),
      );

    const [closedResult] = await db
      .select({ count: sql<number>`count(DISTINCT user_id)::int` })
      .from(userEvents)
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_closed_without_action"),
          ...dateConditions,
        ),
      );

    // ES stats (filtered by country = 'ES')
    const [esShownResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_shown"),
          eq(users.country, "ES"),
          ...dateConditions,
        ),
      );

    const [esCtaResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_cta_clicked"),
          eq(users.country, "ES"),
          ...dateConditions,
        ),
      );

    const [esClosedResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_closed_without_action"),
          eq(users.country, "ES"),
          ...dateConditions,
        ),
      );

    // PT stats (filtered by country = 'PT')
    const [ptShownResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_shown"),
          eq(users.country, "PT"),
          ...dateConditions,
        ),
      );

    const [ptCtaResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_cta_clicked"),
          eq(users.country, "PT"),
          ...dateConditions,
        ),
      );

    const [ptClosedResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_closed_without_action"),
          eq(users.country, "PT"),
          ...dateConditions,
        ),
      );

    // BR stats (filtered by country = 'BR')
    const [brShownResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_shown"),
          eq(users.country, "BR"),
          ...dateConditions,
        ),
      );

    const [brCtaResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_cta_clicked"),
          eq(users.country, "BR"),
          ...dateConditions,
        ),
      );

    const [brClosedResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${userEvents.userId})::int` })
      .from(userEvents)
      .innerJoin(users, eq(userEvents.userId, users.id))
      .where(
        and(
          eq(userEvents.eventName, "welcome_modal_closed_without_action"),
          eq(users.country, "BR"),
          ...dateConditions,
        ),
      );

    return {
      shown: shownResult?.count || 0,
      ctaClicked: ctaResult?.count || 0,
      closedWithoutAction: closedResult?.count || 0,
      es: {
        shown: esShownResult?.count || 0,
        ctaClicked: esCtaResult?.count || 0,
        closedWithoutAction: esClosedResult?.count || 0,
      },
      pt: {
        shown: ptShownResult?.count || 0,
        ctaClicked: ptCtaResult?.count || 0,
        closedWithoutAction: ptClosedResult?.count || 0,
      },
      br: {
        shown: brShownResult?.count || 0,
        ctaClicked: brCtaResult?.count || 0,
        closedWithoutAction: brClosedResult?.count || 0,
      },
    };
  }
  async fixCorruptedKitJsonFields(): Promise<number> {
    const jsonbFields = ['paints', 'reference_photos', 'reference_documents', 'build_photos', 'useful_links'];
    let totalFixed = 0;
    for (const field of jsonbFields) {
      const result = await db.execute(
        sql.raw(`UPDATE kits SET ${field} = '[]'::jsonb WHERE ${field} IS NOT NULL AND jsonb_typeof(${field}) != 'array'`)
      );
      const count = (result as any).rowCount || 0;
      if (count > 0) {
        console.log(`[fixCorruptedKitJsonFields] Fixed ${count} rows for field ${field}`);
        totalFixed += count;
      }
    }
    return totalFixed;
  }
}

export const storage = new DatabaseStorage();
