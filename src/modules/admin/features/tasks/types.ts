import type {
	students,
	taskAssignees,
	taskStudents,
	tasks,
	users,
} from '@/core/database';

export type Task = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type TaskStudent = typeof taskStudents.$inferSelect;
export type TaskWithRelations = Task & {
	assignees: { user: typeof users.$inferSelect }[];
	students: { student: typeof students.$inferSelect }[];
	creator: typeof users.$inferSelect;
};
export type TaskWithAssignees = TaskWithRelations;
export type TaskPriority = Task['priority'];
export type TaskStatus = Task['status'];
