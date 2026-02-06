'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	MultiSelect,
	Select,
	Stack,
	Switch,
	TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import type { SubjectGradeRules } from '../_lib/types';

type SubjectGroup = NonNullable<SubjectGradeRules['subjectGroups']>[0];
type Subject = { id: string; name: string };

type Props = {
	group?: SubjectGroup;
	subjects: Subject[];
	onSave: (group: SubjectGroup) => void;
	mode: 'add' | 'edit';
};

const standardGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];

export default function SubjectGroupModal({
	group,
	subjects,
	onSave,
	mode,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [formData, setFormData] = useState<SubjectGroup>(
		group || { name: '', subjectIds: [], minimumGrade: 'C', required: false }
	);

	const handleOpen = () => {
		setFormData(
			group || { name: '', subjectIds: [], minimumGrade: 'C', required: false }
		);
		open();
	};

	const handleSave = () => {
		onSave(formData);
		close();
	};

	const isValid = formData.name.trim() && formData.subjectIds.length > 0;

	return (
		<>
			{mode === 'add' ? (
				<ActionIcon variant='light' color='blue' onClick={handleOpen}>
					<IconPlus size={16} />
				</ActionIcon>
			) : (
				<ActionIcon variant='subtle' size='sm' onClick={handleOpen}>
					<IconPencil size={14} />
				</ActionIcon>
			)}

			<Modal
				opened={opened}
				onClose={close}
				title={mode === 'add' ? 'Add Subject Group' : 'Edit Subject Group'}
				centered
			>
				<Stack gap='md'>
					<TextInput
						label='Group Name'
						placeholder='e.g., Science, Languages'
						required
						value={formData.name}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, name: e.target.value }))
						}
					/>

					<MultiSelect
						label='Subjects'
						placeholder='Select subjects in this group'
						description='Student must pass one subject from this group'
						required
						data={subjects.map((s) => ({ value: s.id, label: s.name }))}
						value={formData.subjectIds}
						onChange={(val) =>
							setFormData((prev) => ({ ...prev, subjectIds: val }))
						}
						searchable
					/>

					<Select
						label='Minimum Grade'
						data={standardGrades}
						value={formData.minimumGrade}
						onChange={(val) =>
							setFormData((prev) => ({
								...prev,
								minimumGrade: val || 'C',
							}))
						}
					/>

					<Switch
						label='Required'
						description='If checked, student must pass at least one subject from this group'
						checked={formData.required}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								required: e.currentTarget.checked,
							}))
						}
					/>

					<Group justify='flex-end' mt='md'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={!isValid}>
							{mode === 'add' ? 'Add Group' : 'Save Changes'}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
