import { Badge } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import {
	deleteCertificateReprint,
	getCertificateReprint,
} from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CertificateReprintDetails({ params }: Props) {
	const { id } = await params;
	const item = await getCertificateReprint(Number(id));

	if (!item) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={item.student?.name ?? String(item.stdNo)}
				queryKey={['certificate-reprints']}
				handleDelete={async () => {
					'use server';
					await deleteCertificateReprint(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Student No'>
					<Link href={`/registry/students/${item.stdNo}`}>{item.stdNo}</Link>
				</FieldView>
				<FieldView label='Student Name'>{item.student?.name}</FieldView>
				<FieldView label='Receipt Number'>
					{item.receiptNumber || 'N/A'}
				</FieldView>
				<FieldView label='Reason'>{item.reason}</FieldView>
				<FieldView label='Status'>
					<Badge
						color={getStatusColor(
							item.status === 'printed' ? 'approved' : 'pending'
						)}
						variant='light'
					>
						{item.status === 'printed' ? 'Printed' : 'Pending'}
					</Badge>
				</FieldView>
				{item.receivedAt && (
					<FieldView label='Received At'>
						{formatDate(item.receivedAt)}
					</FieldView>
				)}
				<FieldView label='Created By'>{item.createdByUser?.name}</FieldView>
				<FieldView label='Created At'>{formatDate(item.createdAt)}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
