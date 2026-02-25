import type { ActivityFragment } from '@/shared/lib/utils/activities';

const LIBRARY_ACTIVITIES = {
	catalog: {
		book_added: { label: 'Book Added', department: 'library' },
		book_updated: { label: 'Book Updated', department: 'library' },
		book_deleted: { label: 'Book Deleted', department: 'library' },
		book_copy_added: { label: 'Book Copy Added', department: 'library' },
		book_copy_updated: { label: 'Book Copy Updated', department: 'library' },
		book_copy_deleted: { label: 'Book Copy Deleted', department: 'library' },
		book_loan_created: {
			label: 'Book Loan Created',
			department: 'library',
		},
		book_loan_renewed: {
			label: 'Book Loan Renewed',
			department: 'library',
		},
		book_returned: { label: 'Book Returned', department: 'library' },
		loan_deleted: { label: 'Loan Deleted', department: 'library' },
		fine_created: { label: 'Fine Created', department: 'library' },
		fine_updated: { label: 'Fine Updated', department: 'library' },
		fine_deleted: { label: 'Fine Deleted', department: 'library' },
		author_created: { label: 'Author Created', department: 'library' },
		author_updated: { label: 'Author Updated', department: 'library' },
		author_deleted: { label: 'Author Deleted', department: 'library' },
		category_created: { label: 'Category Created', department: 'library' },
		category_updated: { label: 'Category Updated', department: 'library' },
		category_deleted: { label: 'Category Deleted', department: 'library' },
		publication_added: {
			label: 'Publication Added',
			department: 'library',
		},
		publication_updated: {
			label: 'Publication Updated',
			department: 'library',
		},
		publication_deleted: {
			label: 'Publication Deleted',
			department: 'library',
		},
		question_paper_uploaded: {
			label: 'Question Paper Uploaded',
			department: 'library',
		},
		question_paper_updated: {
			label: 'Question Paper Updated',
			department: 'library',
		},
		question_paper_deleted: {
			label: 'Question Paper Deleted',
			department: 'library',
		},
		library_settings_updated: {
			label: 'Library Settings Updated',
			department: 'library',
		},
		external_library_added: {
			label: 'External Library Added',
			department: 'library',
		},
		external_library_updated: {
			label: 'External Library Updated',
			department: 'library',
		},
		external_library_deleted: {
			label: 'External Library Deleted',
			department: 'library',
		},
	},
	tableOperationMap: {
		'books:INSERT': 'book_added',
		'books:UPDATE': 'book_updated',
		'books:DELETE': 'book_deleted',
		'book_copies:INSERT': 'book_copy_added',
		'book_copies:UPDATE': 'book_copy_updated',
		'book_copies:DELETE': 'book_copy_deleted',
		'loans:INSERT': 'book_loan_created',
		'loans:UPDATE': 'book_returned',
		'loans:DELETE': 'loan_deleted',
		'fines:INSERT': 'fine_created',
		'fines:UPDATE': 'fine_updated',
		'fines:DELETE': 'fine_deleted',
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
	},
} as const satisfies ActivityFragment;

export default LIBRARY_ACTIVITIES;

export type LibraryActivityType = keyof typeof LIBRARY_ACTIVITIES.catalog;
