import {
	Badge,
	Divider,
	Group,
	Image,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLoanStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import RenewalModal from '../_components/RenewalModal';
import ReturnModal from '../_components/ReturnModal';
import { deleteLoan, getLoan } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function LoanDetailsPage({ params }: Props) {
	const { id } = await params;
	const loan = await getLoan(Number(id));

	if (!loan) return notFound();

	const isActive = loan.status === 'Active';
	const isOverdue = isActive && (loan.daysOverdue ?? 0) > 0;
	const displayStatus = isOverdue ? 'Overdue' : loan.status;
	const fineAmount = (loan.daysOverdue ?? 0) * 1;

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Loan Details'
				queryKey={['loans']}
				handleDelete={async () => {
					'use server';
					await deleteLoan(Number(id));
				}}
				hideEdit
			/>

			<DetailsViewBody>
				<Stack gap='md'>
					{isActive && (
						<Group justify='flex-end' gap='xs'>
							<RenewalModal loan={loan} />
							<ReturnModal loan={loan} />
						</Group>
					)}

					<Group justify='space-between' align='flex-start'>
						<Stack gap='xs' flex={1}>
							<Text size='lg' fw={600}>
								Book Information
							</Text>
							<Group align='flex-start'>
								{loan.bookCopy.book.coverUrl && (
									<Image
										src={loan.bookCopy.book.coverUrl}
										alt={loan.bookCopy.book.title}
										w={80}
										h={100}
										fit='contain'
										radius='sm'
									/>
								)}
								<Stack gap='xs'>
									<FieldView label='Title'>
										<Link href={`/library/books/${loan.bookCopy.book.id}`}>
											{loan.bookCopy.book.title}
										</Link>
									</FieldView>
									<FieldView label='ISBN'>{loan.bookCopy.book.isbn}</FieldView>
								</Stack>
							</Group>
						</Stack>

						<Badge
							size='lg'
							variant='light'
							color={getLoanStatusColor(displayStatus)}
						>
							{displayStatus}
						</Badge>
					</Group>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Copy Information
						</Text>
						<Group>
							<FieldView label='Serial Number'>
								{loan.bookCopy.serialNumber}
							</FieldView>
							<FieldView label='Condition'>{loan.bookCopy.condition}</FieldView>
							<FieldView label='Location'>
								{loan.bookCopy.location || '-'}
							</FieldView>
						</Group>
					</Stack>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Borrower
						</Text>
						<Group>
							<FieldView label='Student Number'>
								<Link href={`/registry/students/${loan.student.stdNo}`}>
									{loan.student.stdNo}
								</Link>
							</FieldView>
							<FieldView label='Name'>{loan.student.name}</FieldView>
						</Group>
					</Stack>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Dates
						</Text>
						<Group>
							<FieldView label='Loan Date'>
								{formatDate(loan.loanDate)}
							</FieldView>
							<FieldView label='Due Date'>
								<Text c={isOverdue ? 'red' : undefined}>
									{formatDate(loan.dueDate)}
								</Text>
							</FieldView>
							{loan.returnDate && (
								<FieldView label='Return Date'>
									{formatDate(loan.returnDate)}
								</FieldView>
							)}
							{isOverdue && (
								<FieldView label='Days Overdue'>
									<Text c='red' fw={500}>
										{loan.daysOverdue} day{loan.daysOverdue !== 1 ? 's' : ''}
									</Text>
								</FieldView>
							)}
						</Group>
					</Stack>

					{isOverdue && (
						<>
							<Divider />
							<Stack gap='xs'>
								<Text size='lg' fw={600}>
									Fine
								</Text>
								<FieldView label='Amount'>
									<Text c='red' fw={500}>
										M {fineAmount.toFixed(2)}
									</Text>
								</FieldView>
							</Stack>
						</>
					)}

					{loan.renewals.length > 0 && (
						<>
							<Divider />
							<Stack gap='xs'>
								<Text size='lg' fw={600}>
									Renewal History
								</Text>
								<Table striped highlightOnHover withTableBorder>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>Previous Due</Table.Th>
											<Table.Th>New Due</Table.Th>
											<Table.Th>Renewed By</Table.Th>
											<Table.Th>Date</Table.Th>
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{loan.renewals.map((r) => (
											<Table.Tr key={r.id}>
												<Table.Td>{formatDate(r.previousDueDate)}</Table.Td>
												<Table.Td>{formatDate(r.newDueDate)}</Table.Td>
												<Table.Td>
													{(r as { renewedByUser?: { name: string | null } })
														.renewedByUser?.name || '-'}
												</Table.Td>
												<Table.Td>{formatDate(r.renewedAt)}</Table.Td>
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							</Stack>
						</>
					)}

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Staff
						</Text>
						<Group>
							<FieldView label='Issued By'>
								{loan.issuedByUser?.name || '-'}
							</FieldView>
							{loan.returnedToUser && (
								<FieldView label='Returned To'>
									{loan.returnedToUser.name || '-'}
								</FieldView>
							)}
						</Group>
					</Stack>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
