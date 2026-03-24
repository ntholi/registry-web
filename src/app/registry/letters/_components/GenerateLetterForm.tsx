'use client';

import {
	Button,
	Card,
	Group,
	Select,
	Stack,
	Text,
	TypographyStylesProvider,
} from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DashboardRole } from '@/core/auth/permissions';
import { authClient } from '@/core/auth-client';
import { unwrap } from '@/shared/lib/actions/actionResult';
import StudentInput from '@/shared/ui/StudentInput';
import StudentPreviewCard from '../../_components/StudentPreviewCard';
import { resolveTemplate } from '../_lib/resolve';
import {
	generateLetter,
	getActiveTemplates,
	getStudentForLetter,
} from '../_server/actions';

export default function GenerateLetterForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const [stdNo, setStdNo] = useState<number | null>(null);
	const [templateId, setTemplateId] = useState<string | null>(null);
	const [preview, setPreview] = useState<string | null>(null);

	const role = (session?.user?.role ?? undefined) as DashboardRole | undefined;

	const { data: templates } = useQuery({
		queryKey: ['letter-templates-active', role],
		queryFn: () => getActiveTemplates(role),
	});

	const { data: studentData } = useQuery({
		queryKey: ['student-for-letter', stdNo],
		queryFn: () => getStudentForLetter(stdNo!),
		enabled: !!stdNo,
	});

	const selectedTemplate = templates?.find((t) => t.id === templateId);

	function handlePreview() {
		if (!selectedTemplate || !studentData) return;
		setPreview(resolveTemplate(selectedTemplate.content, studentData));
	}

	const mutation = useMutation({
		mutationFn: async () => {
			if (!templateId || !stdNo) return;
			return unwrap(await generateLetter(templateId, stdNo));
		},
		onSuccess: (letter) => {
			if (!letter) return;
			queryClient.invalidateQueries({ queryKey: ['letters'] });
			router.push(`/registry/letters/${letter.id}`);
		},
	});

	const templateOptions =
		templates?.map((t) => ({ value: t.id, label: t.name })) ?? [];

	return (
		<Stack>
			<StudentInput
				value={stdNo ?? undefined}
				onChange={(val) => {
					setStdNo(typeof val === 'number' ? val : null);
					setPreview(null);
				}}
				required
			/>

			{studentData && (
				<StudentPreviewCard
					student={{ name: studentData.name, stdNo: studentData.stdNo }}
				/>
			)}

			<Select
				label='Letter Template'
				placeholder='Select a template...'
				data={templateOptions}
				value={templateId}
				onChange={setTemplateId}
				searchable
				required
			/>

			<Group>
				<Button
					variant='light'
					onClick={handlePreview}
					disabled={!templateId || !studentData}
				>
					Preview
				</Button>
				<Button
					leftSection={<IconSend size={16} />}
					onClick={() => mutation.mutate()}
					loading={mutation.isPending}
					disabled={!templateId || !stdNo}
				>
					Generate Letter
				</Button>
			</Group>

			{preview && (
				<Card withBorder p='md'>
					<Text fw={600} size='sm' mb='xs'>
						Preview
					</Text>
					<TypographyStylesProvider>
						<div dangerouslySetInnerHTML={{ __html: preview }} />
					</TypographyStylesProvider>
				</Card>
			)}
		</Stack>
	);
}
