import {
	Badge,
	Divider,
	Grid,
	GridCol,
	Group,
	Image,
	Stack,
	Text,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import { getReservationStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import CancelModal from '../_components/CancelModal';
import FulfillModal from '../_components/FulfillModal';
import { deleteReservation, getReservation } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ReservationDetailsPage({ params }: Props) {
	const { id } = await params;
	const reservation = await getReservation(id);

	if (!reservation) return notFound();

	const isActive = reservation.status === 'Active';
	const isExpired = isActive && (reservation.isExpired ?? false);
	const displayStatus = isExpired ? 'Expired' : reservation.status;

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Reservation Details'
				queryKey={['reservations']}
				handleDelete={async () => {
					'use server';
					await deleteReservation(id);
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
								{reservation.book.coverUrl && (
									<Image
										src={reservation.book.coverUrl}
										alt={reservation.book.title}
										w={80}
										h={100}
										fit='contain'
										radius='sm'
									/>
								)}
								<Stack gap='xs'>
									<FieldView label='Title' underline={false}>
										<Link href={`/library/books/${reservation.book.id}`}>
											{reservation.book.title}
										</Link>
									</FieldView>
									<FieldView label='ISBN' underline={false}>
										{reservation.book.isbn}
									</FieldView>
								</Stack>
							</Group>
						</Stack>

						<Stack align='flex-end' gap='md'>
							<Badge
								variant='light'
								color={getReservationStatusColor(displayStatus)}
							>
								{displayStatus}
							</Badge>
							{isActive && !isExpired && (
								<Group justify='flex-end' gap='xs'>
									<FulfillModal reservation={reservation} />
									<CancelModal reservation={reservation} />
								</Group>
							)}
						</Stack>
					</Group>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Student
						</Text>
						<Grid>
							<GridCol span={4}>
								<FieldView label='Student Number' underline={false}>
									<Link
										href={`/registry/students/${reservation.student.stdNo}`}
									>
										{reservation.student.stdNo}
									</Link>
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								<FieldView label='Name' underline={false}>
									{reservation.student.name}
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
								<FieldView label='Reservation Date' underline={false}>
									{formatDate(reservation.reservationDate)}
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								<FieldView label='Expiry Date' underline={false}>
									<Text c={isExpired ? 'red' : undefined}>
										{formatDate(reservation.expiryDate)}
									</Text>
								</FieldView>
							</GridCol>
							{reservation.fulfilledAt && (
								<GridCol span={4}>
									<FieldView label='Fulfilled Date' underline={false}>
										{formatDate(reservation.fulfilledAt)}
									</FieldView>
								</GridCol>
							)}
							{reservation.cancelledAt && (
								<GridCol span={4}>
									<FieldView label='Cancelled Date' underline={false}>
										{formatDate(reservation.cancelledAt)}
									</FieldView>
								</GridCol>
							)}
						</Grid>
					</Stack>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Staff
						</Text>
						<Grid>
							<GridCol span={4}>
								<FieldView label='Reserved By' underline={false}>
									{reservation.reservedByUser?.name || '-'}
								</FieldView>
							</GridCol>
							{reservation.fulfilledByUser && (
								<GridCol span={4}>
									<FieldView label='Fulfilled By' underline={false}>
										{reservation.fulfilledByUser.name || '-'}
									</FieldView>
								</GridCol>
							)}
							{reservation.cancelledByUser && (
								<GridCol span={4}>
									<FieldView label='Cancelled By' underline={false}>
										{reservation.cancelledByUser.name || '-'}
									</FieldView>
								</GridCol>
							)}
						</Grid>
					</Stack>

					{reservation.notes && (
						<>
							<Divider />
							<Stack gap='xs'>
								<Text size='lg' fw={600}>
									Notes
								</Text>
								<Text size='sm' c='dimmed'>
									{reservation.notes}
								</Text>
							</Stack>
						</>
					)}
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
