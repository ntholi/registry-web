import {
	Badge,
	Divider,
	Grid,
	GridCol,
	Group,
	Image,
	Stack,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import { getLoanStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
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
					<Group justify='space-between' align='flex-start'>
						<Stack gap='xs' flex={1}>
							<Text size='lg' fw={600}>
								Book Information
							</Text>
							<Divider />
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
									<FieldView label='Title' underline={false}>
										<Link href={`/library/books/${loan.bookCopy.book.id}`}>
											{loan.bookCopy.book.title}
										</Link>
									</FieldView>
									<FieldView label='ISBN' underline={false}>
										{loan.bookCopy.book.isbn}
									</FieldView>
								</Stack>
							</Group>
						</Stack>

						<Stack align='flex-end' gap='md'>
							<Badge variant='light' color={getLoanStatusColor(displayStatus)}>
								{displayStatus}
							</Badge>
							{isActive && (
								<Group justify='flex-end' gap='xs'>
									<RenewalModal loan={loan} />
									<ReturnModal loan={loan} />
								</Group>
							)}
						</Stack>
					</Group>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Copy Information
						</Text>
						<Grid>
							<GridCol span={4}>
								<FieldView label='Serial Number' underline={false}>
									{loan.bookCopy.serialNumber}
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								<FieldView label='Condition' underline={false}>
									{loan.bookCopy.condition}
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								<FieldView label='Location' underline={false}>
									{loan.bookCopy.location || '-'}
								</FieldView>
							</GridCol>
						</Grid>
					</Stack>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Borrower
						</Text>
						<Grid>
							<GridCol span={4}>
								<FieldView label='Student Number' underline={false}>
									<Link href={`/registry/students/${loan.student.stdNo}`}>
										{loan.student.stdNo}
									</Link>
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								<FieldView label='Name' underline={false}>
									{loan.student.name}
								</FieldView>
							</GridCol>
						</Grid>
					</Stack>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Dates
						</Text>
						<Grid>
							<GridCol span={4}>
								<FieldView label='Loan Date' underline={false}>
									{formatDate(loan.loanDate)}
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								<FieldView label='Due Date' underline={false}>
									<Text c={isOverdue ? 'red' : undefined}>
										{formatDate(loan.dueDate)}
									</Text>
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								{loan.returnDate && (
									<FieldView label='Return Date' underline={false}>
										{formatDate(loan.returnDate)}
									</FieldView>
								)}
							</GridCol>
							<GridCol span={4}>
								{isOverdue && (
									<FieldView label='Days Overdue ' underline={false}>
										<Text c='red' fw={500}>
											{loan.daysOverdue} day{loan.daysOverdue !== 1 ? 's' : ''}
										</Text>
									</FieldView>
								)}
							</GridCol>
						</Grid>
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

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Staff
						</Text>
						<Grid>
							<GridCol span={4}>
								<FieldView label='Issued By' underline={false}>
									{loan.issuedByUser?.name || '-'}
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								{loan.returnedToUser && (
									<FieldView label='Returned To' underline={false}>
										{loan.returnedToUser.name || '-'}
									</FieldView>
								)}
							</GridCol>
						</Grid>
					</Stack>

					{loan.renewals.length > 0 && (
						<>
							<Divider />
							<Stack gap='xs'>
								<Text size='lg' fw={600}>
									Renewal History
								</Text>
								<Table striped highlightOnHover withTableBorder>
									<TableThead>
										<TableTr>
											<TableTh>Previous Due</TableTh>
											<TableTh>New Due</TableTh>
											<TableTh>Renewed By</TableTh>
											<TableTh>Date</TableTh>
										</TableTr>
									</TableThead>
									<TableTbody>
										{loan.renewals.map((r) => (
											<TableTr key={r.id}>
												<TableTd>{formatDate(r.previousDueDate)}</TableTd>
												<TableTd>{formatDate(r.newDueDate)}</TableTd>
												<TableTd>
													{(r as { renewedByUser?: { name: string | null } })
														.renewedByUser?.name || '-'}
												</TableTd>
												<TableTd>{formatDate(r.renewedAt)}</TableTd>
											</TableTr>
										))}
									</TableTbody>
								</Table>
							</Stack>
						</>
					)}
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
