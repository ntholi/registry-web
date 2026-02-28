import type {
	ZohoCreditNote,
	ZohoCreditNoteStatus,
} from '@finance/_lib/zoho-books/types';
import { statusColors } from '@/shared/lib/utils/colors';
import {
	CurrencyCell,
	DateCell,
	NumberCell,
	RefCell,
	StatusBadge,
	type TransactionColumn,
	TransactionTable,
} from './TransactionTable';

type Props = {
	creditNotes: ZohoCreditNote[];
};

const LABEL_MAP: Record<ZohoCreditNoteStatus, string> = {
	draft: 'Draft',
	open: 'Open',
	closed: 'Closed',
	void: 'Void',
};

const columns: TransactionColumn<ZohoCreditNote>[] = [
	{
		key: 'date',
		label: 'Date',
		render: (row) => <DateCell date={row.date} />,
	},
	{
		key: 'number',
		label: 'Credit Note #',
		render: (row) => <NumberCell value={row.creditnote_number} />,
	},
	{
		key: 'ref',
		label: 'Reference',
		render: (row) => <RefCell value={row.reference_number} />,
	},
	{
		key: 'total',
		label: 'Amount',
		align: 'right',
		render: (row) => <CurrencyCell amount={row.total} />,
	},
	{
		key: 'balance',
		label: 'Balance',
		align: 'right',
		render: (row) => (
			<CurrencyCell
				amount={row.balance}
				color={row.balance > 0 ? 'cyan' : undefined}
			/>
		),
	},
	{
		key: 'status',
		label: 'Status',
		align: 'center',
		render: (row) => (
			<StatusBadge
				status={row.status}
				colorMap={statusColors.creditNoteStatus}
				labelMap={LABEL_MAP}
			/>
		),
	},
];

export function CreditNotesTab({ creditNotes }: Props) {
	return (
		<TransactionTable
			data={creditNotes}
			columns={columns}
			rowKey={(r) => r.creditnote_id}
			emptyLabel='No credit notes found.'
		/>
	);
}
