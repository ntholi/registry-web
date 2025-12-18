import type { taskAssignees, tasks, users } from '@/core/database';

export type Task = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type TaskWithAssignees = Task & {
	assignees: { user: typeof users.$inferSelect }[];
	creator: typeof users.$inferSelect;
};
export type TaskPriority = Task['priority'];
export type TaskStatus = Task['status'];
