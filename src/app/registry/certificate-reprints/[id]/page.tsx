import { Badge, Divider, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import StatusSwitch from '../_components/StatusSwitch';
import StudentInfoCard from '../_components/StudentInfoCard';
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
				<StudentInfoCard stdNo={item.stdNo} />

				<StatusSwitch id={item.id} status={item.status} />

				<Divider />

				<Stack gap='xs'>
					<FieldView label='Student No'>
						<Link href={`/registry/students/${item.stdNo}`}>{item.stdNo}</Link>
					</FieldView>
					{item.receiptNumber && (
						<FieldView label='Receipt Number'>{item.receiptNumber}</FieldView>
					)}
					<FieldView label='Reason'>
						<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
							{item.reason}
						</Text>
					</FieldView>
					{item.receivedAt && (
						<FieldView label='Received At'>
							{formatDate(item.receivedAt)}
						</FieldView>
					)}
					<FieldView label='Created By'>
						<Badge variant='light' color='gray'>
							{item.createdByUser?.name}
						</Badge>
					</FieldView>
					<FieldView label='Created At'>{formatDate(item.createdAt)}</FieldView>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
