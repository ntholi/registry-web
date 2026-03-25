'use client';

import { Button, Group, Modal, Select, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DashboardRole } from '@/core/auth/permissions';
import { authClient } from '@/core/auth-client';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { DeleteButton } from '@/shared/ui/adease';
import StudentInput from '@/shared/ui/StudentInput';
import StudentPreviewCard from '../../_components/StudentPreviewCard';
import { resolveTemplate } from '../_lib/resolve';
import {
	deleteRecipient,
	generateLetter,
	getActiveTemplates,
	getRecipientsByTemplate,
	getStudentForLetter,
} from '../_server/actions';
import LetterPreview from './LetterPreview';
import NewRecipientModal from './NewRecipientModal';
import TemplatePicker from './TemplatePicker';

const SALUTATION_OPTIONS = [
	'Dear Sir/Madam,',
	'Dear Sir,',
	'Dear Madam,',
	'Dear Director,',
	'To Whom It May Concern,',
];

export default function GenerateLetterForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const [stdNo, setStdNo] = useState<number | null>(null);
	const [templateId, setTemplateId] = useState<string | null>(null);
	const [recipientId, setRecipientId] = useState<string | null>(null);
	const [salutation, setSalutation] = useState<string | null>(null);
	const [preview, setPreview] = useState<string | null>(null);

	const [previewOpened, { open: openPreview, close: closePreview }] =
		useDisclosure(false);

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

	const { data: recipients } = useQuery({
		queryKey: ['letter-recipients', templateId],
		queryFn: () => getRecipientsByTemplate(templateId!),
		enabled: !!templateId,
	});

	function handleTemplateChange(id: string | null) {
		setTemplateId(id);
		setRecipientId(null);
		setPreview(null);
		const tpl = templates?.find((t) => t.id === id);
		setSalutation(tpl?.salutation ?? 'Dear Sir/Madam,');
	}

	if (recipients?.length && !recipientId && templateId) {
		setRecipientId(recipients[0].id);
	}

	function handlePreview() {
		if (!selectedTemplate || !studentData) return;
		setPreview(resolveTemplate(selectedTemplate.content, studentData));
		openPreview();
	}

	const mutation = useMutation({
		mutationFn: async () => {
			if (!templateId || !stdNo) return;
			return unwrap(
				await generateLetter(templateId, stdNo, {
					recipientId: recipientId ?? undefined,
					salutation: salutation ?? undefined,
				})
			);
		},
		onSuccess: (letter) => {
			if (!letter) return;
			queryClient.invalidateQueries({ queryKey: ['letters'] });
			router.push(`/registry/letters/generate/${letter.id}`);
		},
	});

	const recipientOptions =
		recipients?.map((r) => ({
			value: r.id,
			label: `${r.title}, ${r.org}${r.city ? `, ${r.city}` : ''}`,
		})) ?? [];

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

			<TemplatePicker
				templates={templates ?? []}
				value={templateId}
				onChange={handleTemplateChange}
				studentData={studentData}
			/>

			{templateId && (
				<>
					<Group align='end'>
						<Select
							label='Recipient'
							placeholder='Select recipient (optional)'
							data={recipientOptions}
							value={recipientId}
							onChange={setRecipientId}
							clearable
							searchable
							style={{ flex: 1 }}
						/>
						<NewRecipientModal
							templateId={templateId}
							onCreated={(id) => {
								queryClient.invalidateQueries({
									queryKey: ['letter-recipients', templateId],
								});
								setRecipientId(id);
							}}
						/>
						{recipientId && (
							<DeleteButton
								handleDelete={async () => {
									await unwrap(await deleteRecipient(recipientId));
								}}
								onSuccess={() => {
									setRecipientId(null);
								}}
								queryKey={['letter-recipients', templateId]}
								itemType='recipient'
								itemName={recipients?.find((r) => r.id === recipientId)?.title}
								warningMessage='This recipient will be removed from the template. This action cannot be undone.'
								variant='light'
								color='red'
								size='input-sm'
							/>
						)}
					</Group>

					<Select
						label='Salutation'
						placeholder='Select a salutation'
						data={SALUTATION_OPTIONS}
						value={salutation}
						onChange={setSalutation}
						searchable
					/>
				</>
			)}

			<Group justify='space-between'>
				<Button
					variant='light'
					onClick={handlePreview}
					disabled={!templateId || !studentData}
				>
					Preview
				</Button>
				<Button
					onClick={() => mutation.mutate()}
					loading={mutation.isPending}
					disabled={!templateId || !stdNo}
				>
					Generate Letter
				</Button>
			</Group>

			<Modal
				opened={previewOpened}
				onClose={closePreview}
				title='Letter Preview'
				size='lg'
				centered
			>
				{preview && (
					<LetterPreview
						content={preview}
						recipient={recipients?.find((r) => r.id === recipientId)}
						salutation={salutation}
						subject={
							selectedTemplate?.subject && studentData
								? resolveTemplate(selectedTemplate.subject, studentData)
								: null
						}
						signOffName={selectedTemplate?.signOffName}
						signOffTitle={selectedTemplate?.signOffTitle}
					/>
				)}
			</Modal>
		</Stack>
	);
}
