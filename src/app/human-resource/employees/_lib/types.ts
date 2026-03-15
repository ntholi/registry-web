import type { employees } from '@/core/database';
import type { ActionData } from '@/shared/lib/utils/actionResult';
import type { getEmployee } from '../_server/actions';

export type Employee = typeof employees.$inferSelect;
export type EmployeeInsert = typeof employees.$inferInsert;
export type EmployeeDetails = NonNullable<ActionData<typeof getEmployee>>;
