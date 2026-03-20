import { Badge, Group } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import {
	deleteMailAccount,
	getMailAccountDetail,
} from '../../accounts/_server/actions';
import AssignmentSection from '../_components/AssignmentSection';
import SetPrimaryButton from '../_components/SetPrimaryButton';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function AccountDetailPage({ params }: Props) {
	const { id } = await params;
	const account = await getMailAccountDetail(id);

	if (!account) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Mail Account'
				queryKey={['mail-accounts']}
				handleDelete={async () => {
					'use server';
					return deleteMailAccount(id);
				}}
				deletePermission={{ mails: ['delete'] }}
				editPermission={{ mails: ['update'] }}
				deleteTitle='Revoke Mail Account'
				message='This will revoke the OAuth authorization and remove all assignments for this email.'
			/>
			<DetailsViewBody>
				<FieldView label='Email'>{account.email}</FieldView>
				<FieldView label='Display Name'>{account.displayName || '-'}</FieldView>
				<FieldView label='Authorized By'>
					{account.user ? (
						<Group gap='xs'>
							<Link
								href={`/admin/users/${account.user.id}`}
								c='blue'
								size='sm'
								td='underline'
							>
								{account.user.name || account.user.email}
							</Link>
						</Group>
					) : (
						'-'
					)}
				</FieldView>
				<FieldView label='Status'>
					<Badge variant='light' color={account.isActive ? 'green' : 'gray'}>
						{account.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</FieldView>
				<FieldView label='Primary'>
					{account.isPrimary ? (
						<Badge variant='light'>Primary</Badge>
					) : (
						<SetPrimaryButton accountId={id} />
					)}
				</FieldView>
				<FieldView label='Signature'>{account.signature || '-'}</FieldView>
				<FieldView label='Last Sync'>
					{formatDateTime(account.lastSyncAt) || 'Never'}
				</FieldView>
				<FieldView label='Authorized'>
					{formatDateTime(account.createdAt)}
				</FieldView>
				<AssignmentSection accountId={id} />
			</DetailsViewBody>
		</DetailsView>
	);
}
