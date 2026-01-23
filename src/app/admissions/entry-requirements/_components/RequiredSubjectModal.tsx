'use client';

import { ActionIcon, Button, Group, Modal, Select, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';

type RequiredSubject = { subjectId: string; minimumGrade: string };
type Subject = { id: string; name: string };

type Props = {
	subject?: RequiredSubject;
	subjects: Subject[];
	onSave: (subject: RequiredSubject) => void;
	mode: 'add' | 'edit';
};

const standardGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];

export default function RequiredSubjectModal({
	subject,
	subjects,
	onSave,
	mode,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [formData, setFormData] = useState<RequiredSubject>(
		subject || { subjectId: '', minimumGrade: 'C' }
	);

	const handleOpen = () => {
		setFormData(subject || { subjectId: '', minimumGrade: 'C' });
		open();
	};

	const handleSave = () => {
		onSave(formData);
		close();
	};

	const isValid = formData.subjectId.trim();

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
				title={
					mode === 'add' ? 'Add Required Subject' : 'Edit Required Subject'
				}
				centered
				size='sm'
			>
				<Stack gap='md'>
					<Select
						label='Subject'
						placeholder='Select subject'
						required
						data={subjects.map((s) => ({ value: s.id, label: s.name }))}
						value={formData.subjectId}
						onChange={(val) =>
							setFormData((prev) => ({ ...prev, subjectId: val || '' }))
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

					<Group justify='flex-end' mt='md'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={!isValid}>
							{mode === 'add' ? 'Add Subject' : 'Save Changes'}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
