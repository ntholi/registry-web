import type { ActivityFragment } from '@/shared/lib/utils/activities';

const REGISTRY_ACTIVITIES = {
	catalog: {
		student_creation: { label: 'Student Creation', department: 'registry' },
		student_update: { label: 'Student Update', department: 'registry' },
		student_deletion: { label: 'Student Deletion', department: 'registry' },
		program_enrollment: {
			label: 'Program Enrollment',
			department: 'registry',
		},
		program_completed: {
			label: 'Program Completed',
			department: 'registry',
		},
		program_activated: {
			label: 'Program Activated',
			department: 'registry',
		},
		program_change: { label: 'Program Change', department: 'registry' },
		program_deleted: { label: 'Program Deleted', department: 'registry' },
		program_deactivated: {
			label: 'Program Deactivated',
			department: 'registry',
		},
		semester_activated: {
			label: 'Semester Activated',
			department: 'registry',
		},
		semester_deferred: {
			label: 'Semester Deferred',
			department: 'registry',
		},
		semester_dropout: { label: 'Semester Dropout', department: 'registry' },
		semester_deleted: { label: 'Semester Deleted', department: 'registry' },
		semester_withdrawal: {
			label: 'Semester Withdrawal',
			department: 'registry',
		},
		semester_repeat: { label: 'Semester Repeat', department: 'registry' },
		semester_deactivated: {
			label: 'Semester Deactivated',
			department: 'registry',
		},
		module_update: { label: 'Module Update', department: 'registry' },
		module_dropped: { label: 'Module Dropped', department: 'registry' },
		module_deleted: { label: 'Module Deleted', department: 'registry' },
		module_repeated: { label: 'Module Repeated', department: 'registry' },
		registration_submitted: {
			label: 'Registration Submitted',
			department: 'registry',
		},
		registration_updated: {
			label: 'Registration Updated',
			department: 'registry',
		},
		registration_cancelled: {
			label: 'Registration Cancelled',
			department: 'registry',
		},
		clearance_created: {
			label: 'Clearance Created',
			department: 'registry',
		},
		clearance_approved: {
			label: 'Clearance Approved',
			department: 'registry',
		},
		clearance_rejected: {
			label: 'Clearance Rejected',
			department: 'registry',
		},
		transcript_print: { label: 'Transcript Print', department: 'registry' },
		statement_of_results_print: {
			label: 'Statement of Results Print',
			department: 'registry',
		},
		student_card_print: {
			label: 'Student Card Print',
			department: 'registry',
		},
		graduation_date_created: {
			label: 'Graduation Date Created',
			department: 'registry',
		},
		graduation_date_updated: {
			label: 'Graduation Date Updated',
			department: 'registry',
		},
		graduation_date_deleted: {
			label: 'Graduation Date Deleted',
			department: 'registry',
		},
		graduation_request_submitted: {
			label: 'Graduation Request Submitted',
			department: 'registry',
		},
		graduation_request_updated: {
			label: 'Graduation Request Updated',
			department: 'registry',
		},
		graduation_clearance_created: {
			label: 'Graduation Clearance Created',
			department: 'registry',
		},
		graduation_clearance_decision: {
			label: 'Graduation Clearance Decision',
			department: 'registry',
		},
		certificate_reprint_created: {
			label: 'Certificate Reprint Created',
			department: 'registry',
		},
		certificate_reprint_updated: {
			label: 'Certificate Reprint Updated',
			department: 'registry',
		},
		certificate_reprint_deleted: {
			label: 'Certificate Reprint Deleted',
			department: 'registry',
		},
		student_program_structure_changed: {
			label: 'Student Program Structure Changed',
			department: 'registry',
		},
		student_blocked: { label: 'Student Blocked', department: 'registry' },
		student_unblocked: {
			label: 'Student Unblocked',
			department: 'registry',
		},
		term_created: { label: 'Term Created', department: 'registry' },
		term_updated: { label: 'Term Updated', department: 'registry' },
		term_settings_updated: {
			label: 'Term Settings Updated',
			department: 'registry',
		},
		document_uploaded: {
			label: 'Document Uploaded',
			department: 'registry',
		},
		document_deleted: { label: 'Document Deleted', department: 'registry' },
		auto_approval_created: {
			label: 'Auto Approval Created',
			department: 'registry',
		},
		auto_approval_updated: {
			label: 'Auto Approval Updated',
			department: 'registry',
		},
		auto_approval_deleted: {
			label: 'Auto Approval Deleted',
			department: 'registry',
		},
		student_status_created: {
			label: 'Student Status Created',
			department: 'registry',
		},
		student_status_updated: {
			label: 'Student Status Updated',
			department: 'registry',
		},
		student_status_approved: {
			label: 'Student Status Approved',
			department: 'registry',
		},
		student_status_rejected: {
			label: 'Student Status Rejected',
			department: 'registry',
		},
		student_status_cancelled: {
			label: 'Student Status Cancelled',
			department: 'registry',
		},
		student_status_approval_updated: {
			label: 'Student Status Approval Updated',
			department: 'registry',
		},
	},
	tableOperationMap: {
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
		'graduation_dates:DELETE': 'graduation_date_deleted',
		'graduation_requests:INSERT': 'graduation_request_submitted',
		'graduation_requests:UPDATE': 'graduation_request_updated',
		'graduation_clearance:INSERT': 'graduation_clearance_created',
		'graduation_clearance:UPDATE': 'graduation_clearance_decision',
		'certificate_reprints:INSERT': 'certificate_reprint_created',
		'certificate_reprints:UPDATE': 'certificate_reprint_updated',
		'certificate_reprints:DELETE': 'certificate_reprint_deleted',
		'blocked_students:INSERT': 'student_blocked',
		'blocked_students:DELETE': 'student_unblocked',
		'terms:INSERT': 'term_created',
		'terms:UPDATE': 'term_updated',
		'term_settings:UPDATE': 'term_settings_updated',
		'student_documents:INSERT': 'document_uploaded',
		'auto_approvals:INSERT': 'auto_approval_created',
		'auto_approvals:UPDATE': 'auto_approval_updated',
		'auto_approvals:DELETE': 'auto_approval_deleted',
		'student_statuses:INSERT': 'student_status_created',
		'student_statuses:UPDATE': 'student_status_updated',
		'student_status_approvals:UPDATE': 'student_status_approval_updated',
	},
} as const satisfies ActivityFragment;

export default REGISTRY_ACTIVITIES;

export type RegistryActivityType = keyof typeof REGISTRY_ACTIVITIES.catalog;

export function resolveStudentProgramActivityType(
	status?: string
): RegistryActivityType {
	switch (status) {
		case 'Completed':
			return 'program_completed';
		case 'Active':
			return 'program_activated';
		case 'Changed':
			return 'program_change';
		case 'Deleted':
			return 'program_deleted';
		case 'Inactive':
			return 'program_deactivated';
		default:
			return 'program_enrollment';
	}
}

export function resolveStudentSemesterActivityType(
	status?: string
): RegistryActivityType {
	switch (status) {
		case 'Active':
			return 'semester_activated';
		case 'Deferred':
			return 'semester_deferred';
		case 'DroppedOut':
			return 'semester_dropout';
		case 'Deleted':
			return 'semester_deleted';
		case 'Withdrawn':
			return 'semester_withdrawal';
		case 'Repeat':
			return 'semester_repeat';
		case 'Inactive':
			return 'semester_deactivated';
		default:
			return 'semester_activated';
	}
}

export function resolveStudentModuleActivityType(
	status?: string
): RegistryActivityType {
	switch (status) {
		case 'Drop':
			return 'module_dropped';
		case 'Delete':
			return 'module_deleted';
		case 'Repeat1':
		case 'Repeat2':
		case 'Repeat3':
			return 'module_repeated';
		default:
			return 'module_update';
	}
}
