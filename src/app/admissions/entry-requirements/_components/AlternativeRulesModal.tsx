'use client';

import {
	ActionIcon,
	Button,
	Divider,
	Group,
	Modal,
	MultiSelect,
	NumberInput,
	Paper,
	ScrollArea,
	Select,
	Stack,
	Switch,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import type { SubjectGradeRules } from '../_lib/types';

type Subject = { id: string; name: string };
type SubjectGroup = NonNullable<SubjectGradeRules['subjectGroups']>[0];

type Props = {
	alternative?: SubjectGradeRules;
	subjects: Subject[];
	onSave: (rules: SubjectGradeRules) => void;
	mode: 'add' | 'edit';
};

const standardGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];

const defaultRules: SubjectGradeRules = {
	type: 'subject-grades',
	minimumGrades: { count: 5, grade: 'C' },
	requiredSubjects: [],
	subjectGroups: [],
};

export default function AlternativeRulesModal({
	alternative,
	subjects,
	onSave,
	mode,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [rules, setRules] = useState<SubjectGradeRules>(
		alternative || defaultRules
	);

	const handleOpen = () => {
		setRules(alternative || defaultRules);
		open();
	};

	const handleSave = () => {
		onSave(rules);
		close();
	};

	const handleAddSubject = () => {
		setRules((prev) => ({
			...prev,
			requiredSubjects: [
				...prev.requiredSubjects,
				{ subjectId: '', minimumGrade: 'C' },
			],
		}));
	};

	const handleUpdateSubject = (
		idx: number,
		field: 'subjectId' | 'minimumGrade',
		value: string
	) => {
		setRules((prev) => ({
			...prev,
			requiredSubjects: prev.requiredSubjects.map((s, i) =>
				i === idx ? { ...s, [field]: value } : s
			),
		}));
	};

	const handleRemoveSubject = (idx: number) => {
		setRules((prev) => ({
			...prev,
			requiredSubjects: prev.requiredSubjects.filter((_, i) => i !== idx),
		}));
	};

	const handleAddGroup = () => {
		setRules((prev) => ({
			...prev,
			subjectGroups: [
				...(prev.subjectGroups || []),
				{ name: '', subjectIds: [], minimumGrade: 'C', required: false },
			],
		}));
	};

	const handleUpdateGroup = (idx: number, group: SubjectGroup) => {
		setRules((prev) => ({
			...prev,
			subjectGroups: prev.subjectGroups?.map((g, i) => (i === idx ? group : g)),
		}));
	};

	const handleRemoveGroup = (idx: number) => {
		setRules((prev) => ({
			...prev,
			subjectGroups: prev.subjectGroups?.filter((_, i) => i !== idx),
		}));
	};

	return (
		<>
			{mode === 'add' ? (
				<Button
					variant='light'
					size='xs'
					leftSection={<IconPlus size={14} />}
					onClick={handleOpen}
				>
					Add Alternative
				</Button>
			) : (
				<ActionIcon variant='subtle' size='sm' onClick={handleOpen}>
					<IconPencil size={14} />
				</ActionIcon>
			)}

			<Modal
				opened={opened}
				onClose={close}
				title={
					mode === 'add'
						? 'Add Alternative Requirements'
						: 'Edit Alternative Requirements'
				}
				centered
				size='xl'
			>
				<ScrollArea.Autosize mah={500}>
					<Stack gap='md'>
						<Text size='sm' c='dimmed'>
							Define an alternative set of requirements that can also satisfy
							entry criteria
						</Text>

						<Group grow>
							<NumberInput
								label='Minimum Passes'
								min={1}
								max={10}
								value={rules.minimumGrades.count}
								onChange={(val) =>
									setRules((prev) => ({
										...prev,
										minimumGrades: {
											...prev.minimumGrades,
											count: Number(val) || 5,
										},
									}))
								}
							/>
							<Select
								label='Minimum Grade'
								data={standardGrades}
								value={rules.minimumGrades.grade}
								onChange={(val) =>
									setRules((prev) => ({
										...prev,
										minimumGrades: {
											...prev.minimumGrades,
											grade: val || 'C',
										},
									}))
								}
							/>
						</Group>

						<Divider />

						<Stack gap='xs'>
							<Group justify='space-between'>
								<Title order={6}>Required Subjects</Title>
								<ActionIcon
									variant='light'
									color='blue'
									onClick={handleAddSubject}
								>
									<IconPlus size={16} />
								</ActionIcon>
							</Group>

							{rules.requiredSubjects.length === 0 && (
								<Text size='xs' c='dimmed'>
									No required subjects defined
								</Text>
							)}

							{rules.requiredSubjects.map((rs, idx) => (
								<Paper key={idx} withBorder p='sm'>
									<Group gap='sm' wrap='nowrap' align='flex-end'>
										<Select
											label='Subject'
											placeholder='Select subject'
											data={subjects.map((s) => ({
												value: s.id,
												label: s.name,
											}))}
											value={rs.subjectId}
											onChange={(val) =>
												handleUpdateSubject(idx, 'subjectId', val || '')
											}
											searchable
											style={{ flex: 1 }}
										/>
										<Select
											label='Min Grade'
											data={standardGrades}
											value={rs.minimumGrade}
											onChange={(val) =>
												handleUpdateSubject(idx, 'minimumGrade', val || 'C')
											}
											w={100}
										/>
										<ActionIcon
											variant='subtle'
											color='red'
											onClick={() => handleRemoveSubject(idx)}
										>
											<IconTrash size={14} />
										</ActionIcon>
									</Group>
								</Paper>
							))}
						</Stack>

						<Divider />

						<Stack gap='xs'>
							<Group justify='space-between'>
								<Title order={6}>Subject Groups</Title>
								<ActionIcon
									variant='light'
									color='blue'
									onClick={handleAddGroup}
								>
									<IconPlus size={16} />
								</ActionIcon>
							</Group>

							<Text size='xs' c='dimmed'>
								Define groups of alternative subjects
							</Text>

							{(rules.subjectGroups || []).map((group, idx) => (
								<SubjectGroupEditor
									key={idx}
									group={group}
									subjects={subjects}
									onUpdate={(g) => handleUpdateGroup(idx, g)}
									onRemove={() => handleRemoveGroup(idx)}
								/>
							))}
						</Stack>

						<Group justify='flex-end' mt='md'>
							<Button variant='default' onClick={close}>
								Cancel
							</Button>
							<Button onClick={handleSave}>
								{mode === 'add' ? 'Add Alternative' : 'Save Changes'}
							</Button>
						</Group>
					</Stack>
				</ScrollArea.Autosize>
			</Modal>
		</>
	);
}

type GroupEditorProps = {
	group: SubjectGroup;
	subjects: Subject[];
	onUpdate: (group: SubjectGroup) => void;
	onRemove: () => void;
};

function SubjectGroupEditor({
	group,
	subjects,
	onUpdate,
	onRemove,
}: GroupEditorProps) {
	return (
		<Paper withBorder p='sm'>
			<Stack gap='sm'>
				<Group justify='space-between'>
					<TextInput
						placeholder='Group name'
						value={group.name}
						onChange={(e) => onUpdate({ ...group, name: e.target.value })}
						style={{ flex: 1 }}
					/>
					<ActionIcon variant='subtle' color='red' onClick={onRemove}>
						<IconTrash size={14} />
					</ActionIcon>
				</Group>

				<MultiSelect
					placeholder='Select subjects'
					data={subjects.map((s) => ({ value: s.id, label: s.name }))}
					value={group.subjectIds}
					onChange={(val) => onUpdate({ ...group, subjectIds: val })}
					searchable
				/>

				<Group>
					<Select
						label='Min Grade'
						data={standardGrades}
						value={group.minimumGrade}
						onChange={(val) => onUpdate({ ...group, minimumGrade: val || 'C' })}
						w={120}
					/>
					<Switch
						label='Required'
						checked={group.required}
						onChange={(e) =>
							onUpdate({ ...group, required: e.currentTarget.checked })
						}
						mt='lg'
					/>
				</Group>
			</Stack>
		</Paper>
	);
}
