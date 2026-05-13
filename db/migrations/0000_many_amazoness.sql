CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'verifikator', 'operator');--> statement-breakpoint
CREATE TYPE "public"."photo_kind" AS ENUM('before', 'after');--> statement-breakpoint
CREATE TYPE "public"."region_level" AS ENUM('kota', 'kecamatan', 'kelurahan');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('baru', 'diterima', 'ditolak', 'duplikat', 'selesai');--> statement-breakpoint
CREATE TYPE "public"."wa_message_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"email" varchar(256) NOT NULL,
	"password_hash" text NOT NULL,
	"nama" varchar(128) NOT NULL,
	"role" "admin_role" DEFAULT 'operator' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"nama" varchar(128) NOT NULL,
	"ikon" varchar(64) NOT NULL,
	"deskripsi" text,
	"bidang" varchar(128),
	"urutan" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regions" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"level" "region_level" NOT NULL,
	"kode" varchar(32) NOT NULL,
	"nama" varchar(128) NOT NULL,
	"parent_kode" varchar(32),
	"geom" geometry(MultiPolygon, 4326) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regions_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_photos" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"report_id" varchar(32) NOT NULL,
	"url" text NOT NULL,
	"kind" "photo_kind" DEFAULT 'before' NOT NULL,
	"uploaded_by_admin" varchar(32),
	"width" integer,
	"height" integer,
	"size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_status_history" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"report_id" varchar(32) NOT NULL,
	"from_status" "report_status",
	"to_status" "report_status" NOT NULL,
	"alasan" text,
	"changed_by_admin" varchar(32),
	"foto_after_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"kode" varchar(24) NOT NULL,
	"category_id" varchar(32) NOT NULL,
	"deskripsi" text NOT NULL,
	"status" "report_status" DEFAULT 'baru' NOT NULL,
	"lat" varchar(32) NOT NULL,
	"lng" varchar(32) NOT NULL,
	"geom" geometry(Point, 4326) NOT NULL,
	"alamat" text,
	"kecamatan" varchar(128),
	"kelurahan" varchar(128),
	"rw" varchar(8),
	"rt" varchar(8),
	"pelapor_nama" varchar(128) NOT NULL,
	"pelapor_wa_hash" varchar(128) NOT NULL,
	"pelapor_wa_enc" text NOT NULL,
	"dukungan_count" integer DEFAULT 0 NOT NULL,
	"parent_report_id" varchar(32),
	"rejected_reason" text,
	"resolved_note" text,
	"resolved_at" timestamp with time zone,
	"ip_hash" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_supports" (
	"report_id" varchar(32) NOT NULL,
	"wa_hash" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_supports_report_id_wa_hash_pk" PRIMARY KEY("report_id","wa_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wa_message_log" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"report_id" varchar(32),
	"template_key" varchar(64) NOT NULL,
	"to_wa" varchar(32) NOT NULL,
	"body" text NOT NULL,
	"status" "wa_message_status" DEFAULT 'pending' NOT NULL,
	"starsender_id" varchar(128),
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wa_otp" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"wa_hash" varchar(128) NOT NULL,
	"code_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used_at" timestamp with time zone,
	"ip_hash" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wa_templates" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"nama" varchar(128) NOT NULL,
	"body" text NOT NULL,
	"variables" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_photos" ADD CONSTRAINT "report_photos_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_supports" ADD CONSTRAINT "report_supports_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wa_message_log" ADD CONSTRAINT "wa_message_log_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regions_geom_idx" ON "regions" USING gist ("geom");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regions_level_idx" ON "regions" USING btree ("level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_geom_idx" ON "reports" USING gist ("geom");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_wa_hash_idx" ON "reports" USING btree ("pelapor_wa_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_category_idx" ON "reports" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_message_log_status_idx" ON "wa_message_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_message_log_report_idx" ON "wa_message_log" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_otp_wa_hash_idx" ON "wa_otp" USING btree ("wa_hash");