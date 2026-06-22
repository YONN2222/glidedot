import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { users } from "../users/schema";

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
    projectId: integer('project_id').notNull(), // Projects table from localization
}, (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.projectId] }),
}));
