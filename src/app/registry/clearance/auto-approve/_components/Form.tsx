'use client';

import { Select, Stack } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { useRouter } from 'nextjs-toploader/app';
import type { DashboardUser } from '@/core/database';
import { Form } from '@/shared/ui/adease';
import StudentInput from '@/shared/ui/StudentInput';
import TermInput from '@/shared/ui/TermInput';
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
					<StudentInput {...form.getInputProps('stdNo')} required />
					<TermInput
						required
						value={form.values.termId as number | null | undefined}
						onChange={(value) =>
							form.setFieldValue(
								'termId',
								typeof value === 'number' ? value : ('' as unknown as number)
							)
						}
						error={form.errors.termId}
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
