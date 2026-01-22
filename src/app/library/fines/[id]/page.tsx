import { Badge, Divider, Group, Stack, Text } from '@mantine/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFineStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import { formatCurrency } from '@/shared/lib/utils/utils';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import PaymentModal from '../_components/PaymentModal';
import { getFine } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function FineDetailsPage({ params }: Props) {
	const { id } = await params;
	const fine = await getFine(id);

	if (!fine) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader title='Fine' queryKey={['fines']} hideEdit />
			<DetailsViewBody>
				<Stack gap='md'>
					<Group justify='space-between'>
						<Text
							size='xl'
							fw={700}
							c={fine.status === 'Unpaid' ? 'red' : undefined}
						>
							{formatCurrency(fine.amount, 'M')}
						</Text>
						<Badge
							size='lg'
							variant='light'
							color={getFineStatusColor(fine.status)}
						>
							{fine.status}
						</Badge>
					</Group>

					<FieldView label='Days Overdue'>
						<Badge color='red' variant='light'>
							{fine.daysOverdue} days
						</Badge>
					</FieldView>

					<Divider label='Loan Details' labelPosition='left' />

					<FieldView label='Book'>
						<Link href={`/library/books/${fine.loan.bookCopy.book.id}`}>
							{fine.loan.bookCopy.book.title}
						</Link>
					</FieldView>

					<Group grow>
						<FieldView label='Loan Date'>
							{fine.loan.loanDate ? formatDate(fine.loan.loanDate) : '-'}
						</FieldView>
						<FieldView label='Due Date'>
							{formatDate(fine.loan.dueDate)}
						</FieldView>
						<FieldView label='Return Date'>
							{fine.loan.returnDate ? formatDate(fine.loan.returnDate) : '-'}
						</FieldView>
					</Group>

					<Divider label='Student Details' labelPosition='left' />

					<FieldView label='Student'>
						<Link href={`/registry/students/${fine.student.stdNo}`}>
							{fine.student.stdNo} - {fine.student.name}
						</Link>
					</FieldView>

					{fine.status === 'Paid' && (
						<>
							<Divider label='Payment Details' labelPosition='left' />

							<Group grow>
								<FieldView label='Receipt Number'>
									{fine.receipt?.receiptNo}
								</FieldView>
								<FieldView label='Paid On'>
									{fine.paidAt ? formatDate(fine.paidAt) : '-'}
								</FieldView>
							</Group>
						</>
					)}

					{fine.status === 'Unpaid' && (
						<Group justify='flex-end' mt='md'>
							<PaymentModal fine={fine} />
						</Group>
					)}
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
