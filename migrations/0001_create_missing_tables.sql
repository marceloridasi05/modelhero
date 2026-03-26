-- Create any missing tables (safe: uses IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "admin_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exchange_tokens" (
	"token" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorite_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ia_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"action_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"kit_number" text,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"scale" text NOT NULL,
	"type" text NOT NULL,
	"tematica" text DEFAULT 'civil' NOT NULL,
	"status" text DEFAULT 'na_caixa' NOT NULL,
	"destino" text DEFAULT 'nenhum' NOT NULL,
	"sale_price" real,
	"is_for_sale" boolean DEFAULT false NOT NULL,
	"sale_listing_links" text[],
	"etapa" text,
	"recipient_name" text,
	"box_image" text,
	"rating" integer DEFAULT 0 NOT NULL,
	"paid_value" real DEFAULT 0 NOT NULL,
	"paid_value_currency" text DEFAULT 'BRL' NOT NULL,
	"current_value" real DEFAULT 0 NOT NULL,
	"hours_worked" real DEFAULT 0 NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"aftermarkets" text[],
	"military_info" jsonb,
	"comments" text,
	"instruction_images" text[],
	"timer_started_at" text,
	"paints" jsonb,
	"reference_photos" jsonb,
	"reference_documents" jsonb,
	"useful_links" jsonb,
	"build_photos" jsonb,
	"sold_date" timestamp,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "materials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"brand" text,
	"unit" text DEFAULT 'unidades' NOT NULL,
	"current_quantity" real DEFAULT 0 NOT NULL,
	"min_quantity" real DEFAULT 0 NOT NULL,
	"paint_line" text,
	"paint_code" text,
	"paint_color" text,
	"paint_hex_color" text,
	"paint_reference" text,
	"paint_type" text,
	"paint_finish" text,
	"supply_type" text,
	"tool_type" text,
	"tool_state" text,
	"tool_last_maintenance" timestamp,
	"decal_scale" text,
	"decal_brand" text,
	"decal_for_kit" text,
	"decal_for_unit" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_reads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"target_user_id" varchar,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rss_feed_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" varchar NOT NULL,
	"guid" text NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"published_at" timestamp,
	"excerpt" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rss_feeds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"site_url" text,
	"last_fetched_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"error_message" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"event_name" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"profile_photo" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'free' NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"preferred_currency" text DEFAULT 'BRL' NOT NULL,
	"preferred_language" text DEFAULT 'pt' NOT NULL,
	"registration_language" text DEFAULT 'pt',
	"copilot_usage_count" integer DEFAULT 0 NOT NULL,
	"duplicate_check_usage_count" integer DEFAULT 0 NOT NULL,
	"photo_ai_usage_count" integer DEFAULT 0 NOT NULL,
	"upgrade_click_count" integer DEFAULT 0 NOT NULL,
	"accepted_terms" boolean DEFAULT false NOT NULL,
	"accepted_terms_at" timestamp,
	"last_login" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"exclude_from_metrics" boolean DEFAULT false NOT NULL,
	"follow_up_email_24h_sent" boolean DEFAULT false NOT NULL,
	"follow_up_email_4d_sent" boolean DEFAULT false NOT NULL,
	"follow_up_email_10d_sent" boolean DEFAULT false NOT NULL,
	"follow_up_email_30d_inactive_sent" boolean DEFAULT false NOT NULL,
	"limit_reached_email_sent" boolean DEFAULT false NOT NULL,
	"gamification_level" integer DEFAULT 0 NOT NULL,
	"levels_unlocked" text[] DEFAULT '{}'::text[],
	"has_completed_first_kit" boolean DEFAULT false NOT NULL,
	"country" text,
	"locale" text,
	"workbench_days" integer DEFAULT 0 NOT NULL,
	"last_workbench_session_date" text,
	"acquisition_source" text,
	"acquisition_medium" text,
	"acquisition_campaign" text,
	"acquisition_content" text,
	"acquisition_term" text,
	"share_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlist_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"brand" text DEFAULT '' NOT NULL,
	"scale" text DEFAULT '' NOT NULL,
	"current_price" real DEFAULT 0 NOT NULL,
	"purchase_links" jsonb,
	"comments" text,
	"photos" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workbench_session_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exchange_tokens" ADD CONSTRAINT "exchange_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "favorite_links" ADD CONSTRAINT "favorite_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ia_actions" ADD CONSTRAINT "ia_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kits" ADD CONSTRAINT "kits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rss_feed_items" ADD CONSTRAINT "rss_feed_items_feed_id_rss_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."rss_feeds"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rss_feeds" ADD CONSTRAINT "rss_feeds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_session_log" ADD CONSTRAINT "workbench_session_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
