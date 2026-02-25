import { Badge, SimpleGrid } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteAutoApproval, getAutoApproval } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function AutoApprovalDetails({ params }: Props) {
	const { id } = await params;
	const rule = await getAutoApproval(Number.parseInt(id, 10));

	if (!rule) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Auto-Approval'
				queryKey={['auto-approvals']}
				editRoles={['finance', 'library', 'admin']}
				handleDelete={async () => {
					'use server';
					await deleteAutoApproval(rule.id);
				}}
			/>
			<DetailsViewBody>
				<SimpleGrid cols={2}>
					<FieldView label='Student Number'>{rule.stdNo}</FieldView>
					<FieldView label='Term'>{rule.term?.code ?? 'Unknown'}</FieldView>
				</SimpleGrid>
				<SimpleGrid cols={2}>
					<FieldView label='Department'>
						<Badge color={rule.department === 'finance' ? 'green' : 'blue'}>
							{rule.department}
						</Badge>
					</FieldView>
					<FieldView label='Created By'>
						{rule.createdByUser?.name ?? 'Unknown'}
					</FieldView>
				</SimpleGrid>
				<FieldView label='Created At'>
					{rule.createdAt?.toLocaleDateString()}
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
