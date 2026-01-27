'use client';

import { NumberInput, Select, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'nextjs-toploader/app';
import { getAllTerms } from '@/app/registry/terms';
import type { DashboardUser } from '@/core/database';
import { Form } from '@/shared/ui/adease';
import { createAutoApproval, updateAutoApproval } from '../_server/actions';

type Props = {
	rule?: {
		id: number;
		stdNo: number;
		termId: number;
		department: DashboardUser;
	};
};

export default function AutoApprovalForm({ rule }: Props) {
	const router = useRouter();
	const { data: session } = useSession();
	const userRole = session?.user?.role as DashboardUser | undefined;
	const isAdmin = userRole === 'admin';

	const { data: terms, isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getAllTerms(),
	});

	const termOptions =
		terms?.map((term) => ({
			value: term.id.toString(),
			label: term.code,
		})) || [];

	const departmentOptions = [
		{ value: 'finance', label: 'Finance' },
		{ value: 'library', label: 'Library' },
	];

	return (
		<Form
			title={rule ? 'Edit Auto-Approval' : 'New Auto-Approval'}
			action={async (values) => {
				const data = {
					stdNo: values.stdNo as number,
					termId: values.termId as number,
					department: values.department as DashboardUser,
				};
				if (rule) {
					return updateAutoApproval(rule.id, data);
				}
				return createAutoApproval(data);
			}}
			queryKey={['auto-approvals']}
			defaultValues={{
				stdNo: rule?.stdNo ?? ('' as unknown as number),
				termId: rule?.termId ?? ('' as unknown as number),
				department: rule?.department ?? (isAdmin ? '' : userRole) ?? '',
			}}
			onSuccess={() => router.back()}
		>
			{(form) => (
				<Stack>
					<NumberInput
						label='Student Number'
						placeholder='Enter student number'
						hideControls
						{...form.getInputProps('stdNo')}
						required
					/>
					<Select
						label='Term'
						placeholder='Select term'
						data={termOptions}
						disabled={termsLoading}
						searchable
						value={form.values.termId?.toString() || ''}
						onChange={(val) =>
							form.setFieldValue(
								'termId',
								val ? Number.parseInt(val, 10) : ('' as unknown as number)
							)
						}
						error={form.errors.termId}
						required
					/>
					<Select
						label='Department'
						placeholder='Select department'
						data={departmentOptions}
						disabled={!isAdmin}
						{...form.getInputProps('department')}
						required
					/>
				</Stack>
			)}
		</Form>
	);
}
