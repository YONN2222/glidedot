import { sqliteTable, text, integer, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";

// Users Table
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    apiKey: text('api_key').notNull().unique(),
    isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
    isOidc: integer('is_oidc', { mode: 'boolean' }).notNull().default(false),
    isReviewer: integer('is_reviewer', { mode: 'boolean' }).notNull().default(false),
    requiresReview: integer('requires_review', { mode: 'boolean' }).notNull().default(false),
    allowSuggestions: integer('allow_suggestions', { mode: 'boolean' }).notNull().default(true),
    enableSuggestions: integer('enable_suggestions', { mode: 'boolean' }).notNull().default(true),
    translationQuota: integer('translation_quota').notNull().default(500),
    baseTranslationQuota: integer('base_translation_quota').notNull().default(500),
    quotaResetPeriodValue: integer('quota_reset_period_value'),
    quotaResetPeriodUnit: text('quota_reset_period_unit'),
    quotaNextResetAt: integer('quota_next_reset_at', { mode: 'timestamp' }),
    avatarUrl: text('avatar_url'),
    oidcGroups: text('oidc_groups'),
});

// Teams Table
export const teams = sqliteTable('teams', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    oidcMappedGroups: text('oidc_mapped_groups'),
});

// Team Members Join Table
export const teamMembers = sqliteTable('team_members', {
    teamId: integer('team_id').notNull().references(() => teams.id),
    userId: integer('user_id').notNull().references(() => users.id),
}, (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.userId] }),
}));

// Team Projects Join Table
export const teamProjects = sqliteTable('team_projects', {
    teamId: integer('team_id').notNull().references(() => teams.id),
    projectId: integer('project_id').notNull(), // We'll assume projects table from localization
}, (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.projectId] }),
}));



// System Settings Table
export const systemSettings = sqliteTable('system_settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});
