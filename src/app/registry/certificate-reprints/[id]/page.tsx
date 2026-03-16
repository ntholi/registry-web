import {
	Box,
	Divider,
	Fieldset,
	Grid,
	GridCol,
	Group,
	Stack,
	Text,
} from '@mantine/core';
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
					return deleteCertificateReprint(id);
				}}
			/>
			<DetailsViewBody>
				<Box>
					<Grid>
						<GridCol span={{ base: 12, md: 8 }}>
							<FieldView underline={false} label='Student No'>
								<Link href={`/registry/students/${item.stdNo}`}>
									{item.stdNo}
								</Link>
							</FieldView>
						</GridCol>
						<GridCol span={{ base: 12, md: 4 }}>
							<StatusUpdateModal id={item.id} status={item.status} />
						</GridCol>
					</Grid>
					<Divider mt='xs' />
				</Box>
				<StudentInfoCard stdNo={item.stdNo} editable={false} />

				<Divider />

				<Stack>
					{item.receiptNumber && (
						<FieldView label='Receipt Number'>{item.receiptNumber}</FieldView>
					)}
					<Fieldset legend='Reason'>
						<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
							{item.reason}
						</Text>
					</Fieldset>
					<Group grow>
						{item.receivedAt && (
							<FieldView label='Received At'>
								{formatDate(item.receivedAt)}
							</FieldView>
						)}
						{item.receivedByUser && (
							<FieldView label='Received By'>
								{item.receivedByUser.name}
							</FieldView>
						)}
					</Group>
					<Group grow>
						<FieldView label='Created By'>{item.createdByUser?.name}</FieldView>
						<FieldView label='Created At'>
							{formatDate(item.createdAt)}
						</FieldView>
					</Group>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
