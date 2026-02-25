import type { ActivityFragment } from '@/shared/lib/utils/activities';

const FINANCE_ACTIVITIES = {
	catalog: {
		payment_receipt_added: {
			label: 'Payment Receipt Added',
			department: 'finance',
		},
		payment_receipt_removed: {
			label: 'Payment Receipt Removed',
			department: 'finance',
		},
		sponsor_created: { label: 'Sponsor Created', department: 'finance' },
		sponsor_updated: { label: 'Sponsor Updated', department: 'finance' },
		sponsor_deleted: { label: 'Sponsor Deleted', department: 'finance' },
		sponsorship_assigned: {
			label: 'Sponsorship Assigned',
			department: 'finance',
		},
		sponsorship_updated: {
			label: 'Sponsorship Updated',
			department: 'finance',
		},
		sponsorship_deleted: {
			label: 'Sponsorship Deleted',
			department: 'finance',
		},
	},
	tableOperationMap: {
		'payment_receipts:INSERT': 'payment_receipt_added',
		'payment_receipts:DELETE': 'payment_receipt_removed',
		'sponsors:INSERT': 'sponsor_created',
		'sponsors:UPDATE': 'sponsor_updated',
		'sponsors:DELETE': 'sponsor_deleted',
		'sponsored_students:INSERT': 'sponsorship_assigned',
		'sponsored_students:UPDATE': 'sponsorship_updated',
		'sponsored_students:DELETE': 'sponsorship_deleted',
	},
} as const satisfies ActivityFragment;

export default FINANCE_ACTIVITIES;

export type FinanceActivityType = keyof typeof FINANCE_ACTIVITIES.catalog;
