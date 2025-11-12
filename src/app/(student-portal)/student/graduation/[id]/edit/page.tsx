import {
	ActionIcon,
	Container,
	Group,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getGraduationRequest } from '@/server/registry/graduation/requests/actions';
import PaymentReceiptsEditor from './PaymentReceiptsEditor';

type Props = {
	params: Promise<{
		id: string;
	}>;
};

export default async function EditGraduationPage({ params }: Props) {
	const session = await auth();

	if (!session?.user?.stdNo) {
		return forbidden();
	}

	const { id } = await params;
	const graduationRequest = await getGraduationRequest(Number(id));

	if (!graduationRequest) {
		return notFound();
	}

	if (graduationRequest.studentProgram.stdNo !== session.user.stdNo) {
		return forbidden();
	}

	return (
		<Container size='md' px='xs'>
			<Stack gap='lg'>
				<Group>
					<ActionIcon
						component={Link}
						href={`/student/graduation/${id}`}
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
					paymentReceipts={graduationRequest.paymentReceipts || []}
				/>
			</Stack>
		</Container>
	);
}
