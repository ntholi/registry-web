import type { ActivityFragment } from '@/shared/lib/utils/activities';

const ADMISSIONS_ACTIVITIES = {
	catalog: {
		application_submitted: {
			label: 'Application Submitted',
			department: 'marketing',
		},
		application_updated: {
			label: 'Application Updated',
			department: 'marketing',
		},
		application_deleted: {
			label: 'Application Deleted',
			department: 'marketing',
		},
		application_status_changed: {
			label: 'Application Status Changed',
			department: 'marketing',
		},
		applicant_document_uploaded: {
			label: 'Applicant Document Uploaded',
			department: 'marketing',
		},
		applicant_document_reviewed: {
			label: 'Applicant Document Reviewed',
			department: 'marketing',
		},
		applicant_document_deleted: {
			label: 'Applicant Document Deleted',
			department: 'marketing',
		},
		deposit_submitted: {
			label: 'Deposit Submitted',
			department: 'marketing',
		},
		deposit_verified: {
			label: 'Deposit Verified',
			department: 'marketing',
		},
		deposit_deleted: { label: 'Deposit Deleted', department: 'marketing' },
		applicant_created: {
			label: 'Applicant Created',
			department: 'marketing',
		},
		applicant_updated: {
			label: 'Applicant Updated',
			department: 'marketing',
		},
		subject_created: { label: 'Subject Created', department: 'marketing' },
		subject_updated: { label: 'Subject Updated', department: 'marketing' },
		subject_deleted: { label: 'Subject Deleted', department: 'marketing' },
		recognized_school_added: {
			label: 'Recognized School Added',
			department: 'marketing',
		},
		recognized_school_updated: {
			label: 'Recognized School Updated',
			department: 'marketing',
		},
		recognized_school_deleted: {
			label: 'Recognized School Deleted',
			department: 'marketing',
		},
		certificate_type_created: {
			label: 'Certificate Type Created',
			department: 'marketing',
		},
		certificate_type_updated: {
			label: 'Certificate Type Updated',
			department: 'marketing',
		},
		certificate_type_deleted: {
			label: 'Certificate Type Deleted',
			department: 'marketing',
		},
		entry_requirement_created: {
			label: 'Entry Requirement Created',
			department: 'marketing',
		},
		entry_requirement_updated: {
			label: 'Entry Requirement Updated',
			department: 'marketing',
		},
		entry_requirement_deleted: {
			label: 'Entry Requirement Deleted',
			department: 'marketing',
		},
		intake_period_created: {
			label: 'Intake Period Created',
			department: 'marketing',
		},
		intake_period_updated: {
			label: 'Intake Period Updated',
			department: 'marketing',
		},
		intake_period_deleted: {
			label: 'Intake Period Deleted',
			department: 'marketing',
		},
	},
	tableOperationMap: {
		'applications:INSERT': 'application_submitted',
		'applications:UPDATE': 'application_updated',
		'applications:DELETE': 'application_deleted',
		'applicant_documents:INSERT': 'applicant_document_uploaded',
		'applicant_documents:UPDATE': 'applicant_document_reviewed',
		'applicant_documents:DELETE': 'applicant_document_deleted',
		'bank_deposits:INSERT': 'deposit_submitted',
		'bank_deposits:UPDATE': 'deposit_verified',
		'bank_deposits:DELETE': 'deposit_deleted',
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
	},
} as const satisfies ActivityFragment;

export default ADMISSIONS_ACTIVITIES;

export type AdmissionsActivityType = keyof typeof ADMISSIONS_ACTIVITIES.catalog;
