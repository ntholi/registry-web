import {
	ACTIVITY_CATALOG,
	type ActivityType,
	getActivityLabel,
	isActivityType,
} from './activity-catalog';

export { getActivityLabel, isActivityType, type ActivityType };

export const ACTIVITY_LABELS: Record<ActivityType, string> = Object.fromEntries(
	Object.entries(ACTIVITY_CATALOG).map(([key, val]) => [key, val.label])
) as Record<ActivityType, string>;

type TableOperation = `${string}:${'INSERT' | 'UPDATE' | 'DELETE'}`;

export const TABLE_OPERATION_MAP: Record<string, ActivityType> = {
	'students:INSERT': 'student_creation',
	'students:UPDATE': 'student_update',
	'students:DELETE': 'student_deletion',
	'student_programs:INSERT': 'program_enrollment',
	'student_semesters:INSERT': 'semester_activated',
	'student_modules:UPDATE': 'module_update',
	'registration_requests:INSERT': 'registration_submitted',
	'registration_requests:UPDATE': 'registration_updated',
	'registration_requests:DELETE': 'registration_cancelled',
	'clearances:INSERT': 'clearance_created',
	'clearances:UPDATE': 'clearance_approved',
	'transcript_prints:INSERT': 'transcript_print',
	'statement_of_results_prints:INSERT': 'statement_of_results_print',
	'student_card_prints:INSERT': 'student_card_print',
	'graduation_dates:INSERT': 'graduation_date_created',
	'graduation_dates:UPDATE': 'graduation_date_updated',
	'graduation_requests:INSERT': 'graduation_request_submitted',
	'graduation_requests:UPDATE': 'graduation_request_updated',
	'graduation_clearance:INSERT': 'graduation_clearance_created',
	'graduation_clearance:UPDATE': 'graduation_clearance_decision',
	'certificate_reprints:INSERT': 'certificate_reprint',
	'blocked_students:INSERT': 'student_blocked',
	'blocked_students:DELETE': 'student_unblocked',
	'terms:INSERT': 'term_created',
	'terms:UPDATE': 'term_updated',
	'term_settings:UPDATE': 'term_settings_updated',
	'student_documents:INSERT': 'document_uploaded',
	'auto_approvals:INSERT': 'auto_approval_created',
	'auto_approvals:UPDATE': 'auto_approval_updated',
	'auto_approvals:DELETE': 'auto_approval_deleted',
	'assessments:INSERT': 'assessment_created',
	'assessments:UPDATE': 'assessment_updated',
	'assessments:DELETE': 'assessment_deleted',
	'assessment_marks:INSERT': 'mark_entered',
	'assessment_marks:UPDATE': 'mark_updated',
	'assessment_marks:DELETE': 'mark_deleted',
	'assigned_modules:INSERT': 'module_assigned',
	'assigned_modules:DELETE': 'module_unassigned',
	'attendance:INSERT': 'attendance_recorded',
	'attendance:UPDATE': 'attendance_updated',
	'modules:INSERT': 'module_created',
	'modules:UPDATE': 'module_updated',
	'semester_modules:INSERT': 'semester_module_created',
	'semester_modules:UPDATE': 'semester_module_updated',
	'semester_modules:DELETE': 'semester_module_deleted',
	'programs:INSERT': 'program_created',
	'programs:UPDATE': 'program_updated',
	'structures:INSERT': 'structure_created',
	'structures:UPDATE': 'structure_updated',
	'structure_semesters:INSERT': 'structure_semester_created',
	'structure_semesters:UPDATE': 'structure_semester_updated',
	'feedback_cycles:INSERT': 'feedback_cycle_created',
	'feedback_cycles:UPDATE': 'feedback_cycle_updated',
	'feedback_categories:INSERT': 'feedback_category_created',
	'feedback_categories:UPDATE': 'feedback_category_updated',
	'feedback_questions:INSERT': 'feedback_question_created',
	'feedback_questions:UPDATE': 'feedback_question_updated',
	'payment_receipts:INSERT': 'payment_receipt_added',
	'payment_receipts:DELETE': 'payment_receipt_removed',
	'sponsors:INSERT': 'sponsor_created',
	'sponsors:UPDATE': 'sponsor_updated',
	'sponsored_students:INSERT': 'sponsorship_assigned',
	'sponsored_students:UPDATE': 'sponsorship_updated',
	'books:INSERT': 'book_added',
	'books:UPDATE': 'book_updated',
	'books:DELETE': 'book_deleted',
	'book_copies:INSERT': 'book_copy_added',
	'book_copies:UPDATE': 'book_copy_updated',
	'loans:INSERT': 'book_loan_created',
	'loans:UPDATE': 'book_returned',
	'loans:DELETE': 'loan_deleted',
	'fines:INSERT': 'fine_created',
	'fines:UPDATE': 'fine_updated',
	'authors:INSERT': 'author_created',
	'authors:UPDATE': 'author_updated',
	'authors:DELETE': 'author_deleted',
	'categories:INSERT': 'category_created',
	'categories:UPDATE': 'category_updated',
	'categories:DELETE': 'category_deleted',
	'publications:INSERT': 'publication_added',
	'publications:UPDATE': 'publication_updated',
	'publications:DELETE': 'publication_deleted',
	'question_papers:INSERT': 'question_paper_uploaded',
	'question_papers:UPDATE': 'question_paper_updated',
	'question_papers:DELETE': 'question_paper_deleted',
	'library_settings:UPDATE': 'library_settings_updated',
	'external_libraries:INSERT': 'external_library_added',
	'external_libraries:UPDATE': 'external_library_updated',
	'external_libraries:DELETE': 'external_library_deleted',
	'applications:INSERT': 'application_submitted',
	'applications:UPDATE': 'application_updated',
	'applicant_documents:INSERT': 'applicant_document_uploaded',
	'applicant_documents:UPDATE': 'applicant_document_reviewed',
	'bank_deposits:INSERT': 'deposit_submitted',
	'bank_deposits:UPDATE': 'deposit_verified',
	'applicants:INSERT': 'applicant_created',
	'applicants:UPDATE': 'applicant_updated',
	'subjects:INSERT': 'subject_created',
	'subjects:UPDATE': 'subject_updated',
	'subjects:DELETE': 'subject_deleted',
	'recognized_schools:INSERT': 'recognized_school_added',
	'recognized_schools:UPDATE': 'recognized_school_updated',
	'recognized_schools:DELETE': 'recognized_school_deleted',
	'certificate_types:INSERT': 'certificate_type_created',
	'certificate_types:UPDATE': 'certificate_type_updated',
	'certificate_types:DELETE': 'certificate_type_deleted',
	'entry_requirements:INSERT': 'entry_requirement_created',
	'entry_requirements:UPDATE': 'entry_requirement_updated',
	'entry_requirements:DELETE': 'entry_requirement_deleted',
	'intake_periods:INSERT': 'intake_period_created',
	'intake_periods:UPDATE': 'intake_period_updated',
	'intake_periods:DELETE': 'intake_period_deleted',
	'users:INSERT': 'user_created',
	'users:UPDATE': 'user_updated',
	'users:DELETE': 'user_deleted',
	'tasks:INSERT': 'task_created',
	'tasks:UPDATE': 'task_updated',
	'notifications:INSERT': 'notification_created',
	'notifications:UPDATE': 'notification_updated',
	'venues:INSERT': 'venue_created',
	'venues:UPDATE': 'venue_updated',
	'venue_types:INSERT': 'venue_type_created',
	'venue_types:UPDATE': 'venue_type_updated',
	'timetable_allocations:INSERT': 'allocation_created',
	'timetable_allocations:UPDATE': 'allocation_updated',
	'timetable_allocations:DELETE': 'allocation_deleted',
	'timetable_slots:INSERT': 'slot_created',
	'timetable_slots:UPDATE': 'slot_updated',
	'timetable_slots:DELETE': 'slot_deleted',
} satisfies Record<TableOperation, ActivityType>;

type Department =
	| 'registry'
	| 'academic'
	| 'finance'
	| 'library'
	| 'marketing'
	| 'admin'
	| 'resource';

export const DEPARTMENT_ACTIVITIES: Record<Department, ActivityType[]> =
	Object.entries(ACTIVITY_CATALOG).reduce(
		(acc, [key, val]) => {
			const dept = val.department as Department;
			if (!acc[dept]) acc[dept] = [];
			acc[dept].push(key as ActivityType);
			return acc;
		},
		{} as Record<Department, ActivityType[]>
	);

export function resolveTableActivity(
	tableName: string,
	operation: 'INSERT' | 'UPDATE' | 'DELETE'
): ActivityType | undefined {
	const key = `${tableName}:${operation}`;
	return TABLE_OPERATION_MAP[key];
}
