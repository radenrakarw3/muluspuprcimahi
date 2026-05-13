import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const geometry = customType<{
  data: string;
  driverData: string;
  config: { srid?: number; type?: string };
}>({
  dataType(config) {
    const type = config?.type ?? "Geometry";
    const srid = config?.srid ?? 4326;
    return `geometry(${type}, ${srid})`;
  },
});

export const reportStatus = pgEnum("report_status", [
  "baru",
  "diterima",
  "ditolak",
  "duplikat",
  "selesai",
]);

export const adminRole = pgEnum("admin_role", [
  "super_admin",
  "verifikator",
  "operator",
]);

export const waMessageStatus = pgEnum("wa_message_status", [
  "pending",
  "sent",
  "failed",
]);

export const regionLevel = pgEnum("region_level", ["kota", "kecamatan", "kelurahan"]);

export const photoKind = pgEnum("photo_kind", ["before", "after"]);

export const categories = pgTable("categories", {
  id: varchar("id", { length: 32 }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nama: varchar("nama", { length: 128 }).notNull(),
  ikon: varchar("ikon", { length: 64 }).notNull(),
  deskripsi: text("deskripsi"),
  bidang: varchar("bidang", { length: 128 }),
  urutan: integer("urutan").default(0).notNull(),
  aktif: boolean("aktif").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const regions = pgTable(
  "regions",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    level: regionLevel("level").notNull(),
    kode: varchar("kode", { length: 32 }).notNull().unique(),
    nama: varchar("nama", { length: 128 }).notNull(),
    parentKode: varchar("parent_kode", { length: 32 }),
    geom: geometry("geom", { type: "MultiPolygon", srid: 4326 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    geomIdx: index("regions_geom_idx").using("gist", t.geom),
    levelIdx: index("regions_level_idx").on(t.level),
  }),
);

export const reports = pgTable(
  "reports",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    kode: varchar("kode", { length: 24 }).notNull().unique(),
    categoryId: varchar("category_id", { length: 32 })
      .notNull()
      .references(() => categories.id),
    deskripsi: text("deskripsi").notNull(),
    status: reportStatus("status").default("baru").notNull(),
    lat: varchar("lat", { length: 32 }).notNull(),
    lng: varchar("lng", { length: 32 }).notNull(),
    geom: geometry("geom", { type: "Point", srid: 4326 }).notNull(),
    alamat: text("alamat"),
    kecamatan: varchar("kecamatan", { length: 128 }),
    kelurahan: varchar("kelurahan", { length: 128 }),
    rw: varchar("rw", { length: 8 }),
    rt: varchar("rt", { length: 8 }),
    pelaporNama: varchar("pelapor_nama", { length: 128 }).notNull(),
    pelaporWaHash: varchar("pelapor_wa_hash", { length: 128 }).notNull(),
    pelaporWaEnc: text("pelapor_wa_enc").notNull(),
    dukunganCount: integer("dukungan_count").default(0).notNull(),
    parentReportId: varchar("parent_report_id", { length: 32 }),
    rejectedReason: text("rejected_reason"),
    resolvedNote: text("resolved_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ipHash: varchar("ip_hash", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("reports_status_idx").on(t.status),
    geomIdx: index("reports_geom_idx").using("gist", t.geom),
    waHashIdx: index("reports_wa_hash_idx").on(t.pelaporWaHash),
    categoryIdx: index("reports_category_idx").on(t.categoryId),
    createdAtIdx: index("reports_created_at_idx").on(t.createdAt),
  }),
);

export const reportPhotos = pgTable("report_photos", {
  id: varchar("id", { length: 32 }).primaryKey(),
  reportId: varchar("report_id", { length: 32 })
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  kind: photoKind("kind").default("before").notNull(),
  uploadedByAdmin: varchar("uploaded_by_admin", { length: 32 }),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reportStatusHistory = pgTable("report_status_history", {
  id: varchar("id", { length: 32 }).primaryKey(),
  reportId: varchar("report_id", { length: 32 })
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  fromStatus: reportStatus("from_status"),
  toStatus: reportStatus("to_status").notNull(),
  alasan: text("alasan"),
  changedByAdmin: varchar("changed_by_admin", { length: 32 }),
  fotoAfterUrl: text("foto_after_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id", { length: 32 }).primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nama: varchar("nama", { length: 128 }).notNull(),
  role: adminRole("role").default("operator").notNull(),
  aktif: boolean("aktif").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const waOtp = pgTable(
  "wa_otp",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    waHash: varchar("wa_hash", { length: 128 }).notNull(),
    codeHash: varchar("code_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    ipHash: varchar("ip_hash", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    waHashIdx: index("wa_otp_wa_hash_idx").on(t.waHash),
  }),
);

export const waTemplates = pgTable("wa_templates", {
  key: varchar("key", { length: 64 }).primaryKey(),
  nama: varchar("nama", { length: 128 }).notNull(),
  body: text("body").notNull(),
  variables: text("variables").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const waMessageLog = pgTable(
  "wa_message_log",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    reportId: varchar("report_id", { length: 32 }).references(() => reports.id, {
      onDelete: "set null",
    }),
    templateKey: varchar("template_key", { length: 64 }).notNull(),
    toWa: varchar("to_wa", { length: 32 }).notNull(),
    body: text("body").notNull(),
    status: waMessageStatus("status").default("pending").notNull(),
    starsenderId: varchar("starsender_id", { length: 128 }),
    retryCount: integer("retry_count").default(0).notNull(),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("wa_message_log_status_idx").on(t.status),
    reportIdx: index("wa_message_log_report_idx").on(t.reportId),
  }),
);

export const supports = pgTable(
  "report_supports",
  {
    reportId: varchar("report_id", { length: 32 })
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    waHash: varchar("wa_hash", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.reportId, t.waHash] }),
  }),
);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type ReportPhoto = typeof reportPhotos.$inferSelect;
export type ReportStatusHistory = typeof reportStatusHistory.$inferSelect;
export type WaTemplate = typeof waTemplates.$inferSelect;

export const ReportStatusValues = [
  "baru",
  "diterima",
  "ditolak",
  "duplikat",
  "selesai",
] as const;

export type ReportStatusValue = (typeof ReportStatusValues)[number];

export { sql };
