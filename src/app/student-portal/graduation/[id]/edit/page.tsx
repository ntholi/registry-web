import {
	ActionIcon,
	Container,
	Group,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { getGraduationRequest } from '@registry/graduation/clearance';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { requireCurrentStudent } from '../../../_server/student';
import { PaymentReceiptsEditor } from '../../_components';

type Props = {
	params: Promise<{
		id: string;
	}>;
};

export default async function EditGraduationPage({ params }: Props) {
	const stdNo = await requireCurrentStudent();

	const { id } = await params;
	const graduationRequest = await getGraduationRequest(Number(id));

	if (!graduationRequest) {
		return notFound();
	}

	if (graduationRequest.studentProgram.stdNo !== stdNo) {
		return forbidden();
	}

	const paymentReceipts =
		graduationRequest.graduationRequestReceipts?.map((r) => r.receipt) || [];

	return (
		<Container size='md' px='xs'>
			<Stack gap='lg'>
				<Group>
					<ActionIcon
						component={Link}
						href={`/student-portal/graduation/${id}`}
						variant='subtle'
						size='lg'
						title='Back to graduation request'
					>
						<IconArrowLeft size='1.2rem' />
					</ActionIcon>
					<div>
						<Title order={1} size='h2' fw={600}>
							Edit Payment Receipts
						</Title>
						<Text c='dimmed' size='sm'>
							Add or remove payment receipts for your graduation request
						</Text>
					</div>
				</Group>

				<PaymentReceiptsEditor
					graduationRequestId={graduationRequest.id}
					paymentReceipts={paymentReceipts}
				/>
			</Stack>
		</Container>
	);
}
