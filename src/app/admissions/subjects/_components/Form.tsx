'use client';

import { subjects } from '@admissions/_database';
import {
	ActionIcon,
	Group,
	NumberInput,
	Paper,
	Stack,
	Switch,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import type { Subject, SubjectAlias } from '../_lib/types';
import { addSubjectAlias, removeSubjectAlias } from '../_server/actions';

type Props = {
	onSubmit: (values: Subject) => Promise<Subject>;
	defaultValues?: Subject & { aliases?: SubjectAlias[] };
	title?: string;
};

export default function SubjectForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	const schema = z.object({
		...createInsertSchema(subjects).shape,
		name: z.string().min(1, 'Name is required'),
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['subjects']}
			schema={schema}
			defaultValues={defaultValues ?? { isActive: true }}
			onSuccess={({ id }) => router.push(`/admissions/subjects/${id}`)}
		>
			{(form) => (
				<Stack gap='md'>
					<TextInput
						label='Name'
						placeholder='e.g., Mathematics'
						required
						{...form.getInputProps('name')}
					/>
					<NumberInput
						label='LQF Level'
						description='Lesotho Qualifications Framework level (e.g., 4 for secondary)'
						placeholder='e.g., 4'
						min={1}
						max={10}
						{...form.getInputProps('lqfLevel')}
					/>
					<Switch
						label='Active'
						{...form.getInputProps('isActive', { type: 'checkbox' })}
					/>
					{defaultValues?.id && (
						<AliasEditor
							subjectId={defaultValues.id}
							aliases={defaultValues.aliases ?? []}
						/>
					)}
				</Stack>
			)}
		</Form>
	);
}

type AliasEditorProps = {
	subjectId: string;
	aliases: SubjectAlias[];
};

function AliasEditor({ subjectId, aliases: initialAliases }: AliasEditorProps) {
	const queryClient = useQueryClient();
	const [aliases, setAliases] = useState(initialAliases);
	const [newAlias, setNewAlias] = useState('');

	const addMutation = useMutation({
		mutationFn: (alias: string) => addSubjectAlias(subjectId, alias),
		onSuccess: (created) => {
			setAliases((prev) => [...prev, created]);
			setNewAlias('');
			queryClient.invalidateQueries({ queryKey: ['subjects'] });
		},
	});

	const removeMutation = useMutation({
		mutationFn: (aliasId: string) => removeSubjectAlias(aliasId),
		onSuccess: (_, aliasId) => {
			setAliases((prev) => prev.filter((a) => a.id !== aliasId));
			queryClient.invalidateQueries({ queryKey: ['subjects'] });
		},
	});

	function handleAdd() {
		const trimmed = newAlias.trim();
		if (trimmed.length < 2) return;
		addMutation.mutate(trimmed);
	}

	return (
		<Paper p='md' withBorder>
			<Stack gap='md'>
				<Title order={6}>Aliases</Title>
				<Text size='xs' c='dimmed'>
					Alternative names used in certificates (LGCSE, BGCSE, NSC, SGCSE)
				</Text>
				<Group gap='xs'>
					<TextInput
						placeholder='Add alias...'
						size='sm'
						style={{ flex: 1 }}
						value={newAlias}
						onChange={(e) => setNewAlias(e.currentTarget.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleAdd();
							}
						}}
					/>
					<ActionIcon
						variant='filled'
						loading={addMutation.isPending}
						onClick={handleAdd}
					>
						<IconPlus size={16} />
					</ActionIcon>
				</Group>
				<Stack gap='xs'>
					{aliases.length === 0 ? (
						<Text size='sm' c='dimmed' fs='italic'>
							No aliases
						</Text>
					) : (
						aliases.map((alias) => (
							<Group key={alias.id} justify='space-between'>
								<Text size='sm'>{alias.alias}</Text>
								<ActionIcon
									size='sm'
									variant='subtle'
									color='red'
									onClick={() => removeMutation.mutate(alias.id)}
									loading={removeMutation.isPending}
								>
									<IconTrash size={14} />
								</ActionIcon>
							</Group>
						))
					)}
				</Stack>
			</Stack>
		</Paper>
	);
}
