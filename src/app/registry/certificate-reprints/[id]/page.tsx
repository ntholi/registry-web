import { Badge, Divider, SimpleGrid, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import StatusUpdateModal from '../_components/StatusUpdateModal';
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
	const item = await getCertificateReprint(id);

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
					await deleteCertificateReprint(id);
				}}
			/>
			<DetailsViewBody>
				<SimpleGrid cols={{ base: 1, sm: 2 }} mb='md'>
					<FieldView underline={false} label='Student No'>
						<Link href={`/registry/students/${item.stdNo}`}>{item.stdNo}</Link>
					</FieldView>
					<StatusUpdateModal id={item.id} status={item.status} />
				</SimpleGrid>
				<StudentInfoCard stdNo={item.stdNo} />

				<Divider />

				<Stack gap='xs'>
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
					{item.receivedByUser && (
						<FieldView label='Received By'>
							<Badge variant='light' color='gray'>
								{item.receivedByUser.name}
							</Badge>
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
