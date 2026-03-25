'use client';

import {
	Badge,
	Box,
	Card,
	Group,
	Input,
	Modal,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileText } from '@tabler/icons-react';
import type { getStudentForLetter } from '../_server/actions';
import { resolveTemplate } from '../_lib/resolve';

type Template = {
	id: string;
	name: string;
	subject: string | null;
	role: string | null;
};

type StudentData = NonNullable<Awaited<ReturnType<typeof getStudentForLetter>>>;

type Props = {
	templates: Template[];
	value: string | null;
	onChange: (id: string | null) => void;
	studentData?: StudentData | null;
};

export default function TemplatePicker({
	templates,
	value,
	onChange,
	studentData,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const selected = templates.find((t) => t.id === value);
	const disabled = !studentData;

	function resolvedSubject(tpl: Template) {
		if (!tpl.subject) return null;
		if (!studentData) return tpl.subject;
		return resolveTemplate(tpl.subject, studentData);
	}

	return (
		<>
			<Input.Wrapper label='Letter Template' required>
				<UnstyledButton
					onClick={disabled ? undefined : open}
					disabled={disabled}
					style={{ display: 'block', width: '100%' }}
				>
					<Paper
						withBorder
						p='sm'
						mt={4}
						style={(theme) => ({
							cursor: disabled ? 'not-allowed' : 'pointer',
							opacity: disabled ? 0.5 : 1,
						})}
					>
						{selected ? (
							<Group gap='sm'>
								<ThemeIcon variant='light' size='lg' radius='md'>
									<IconFileText size={18} />
								</ThemeIcon>
								<Box style={{ flex: 1, minWidth: 0 }}>
									<Text fw={600} size='sm' lineClamp={1}>
										{selected.name}
									</Text>
									{selected.subject && (
										<Text size='xs' c='dimmed' lineClamp={1}>
											{resolvedSubject(selected)}
										</Text>
									)}
								</Box>
								{selected.role && (
									<Badge size='xs' variant='light'>
										{selected.role}
									</Badge>
								)}
							</Group>
						) : (
							<Group gap='sm'>
								<ThemeIcon variant='light' size='lg' radius='md' color='gray'>
									<IconFileText size={18} />
								</ThemeIcon>
								<Text size='sm' c='dimmed'>
									{disabled
									? 'Select a student first…'
									: 'Click to choose a letter template…'}
								</Text>
							</Group>
						)}
					</Paper>
				</UnstyledButton>
			</Input.Wrapper>

			<Modal
				opened={opened}
				onClose={close}
				title='Choose a Letter Template'
				size='xl'
				centered
				scrollAreaComponent={ScrollArea.Autosize}
			>
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
					{templates.map((tpl) => {
						const subject = resolvedSubject(tpl);
						return (
							<UnstyledButton
								key={tpl.id}
								onClick={() => {
									onChange(tpl.id);
									close();
								}}
							>
								<Card
									withBorder
									padding='lg'
									radius='md'
									style={(theme) => ({
										borderColor:
											value === tpl.id ? theme.colors.blue[6] : undefined,
										borderWidth: value === tpl.id ? 2 : 1,
										transition: 'border-color 150ms, box-shadow 150ms',
										height: '100%',
										cursor: 'pointer',
									})}
								>
									<Stack gap='xs'>
										<ThemeIcon
											variant='light'
											size='xl'
											radius='md'
											color={value === tpl.id ? 'blue' : 'gray'}
										>
											<IconFileText size={22} />
										</ThemeIcon>
										<Box>
											<Text fw={600} size='sm' lineClamp={2}>
												{tpl.name}
											</Text>
											{subject && (
												<Text size='xs' c='dimmed' lineClamp={2} mt={2}>
													{subject}
												</Text>
											)}
										</Box>
										{tpl.role && (
											<Badge size='xs' variant='light' w='fit-content'>
												{tpl.role}
											</Badge>
										)}
									</Stack>
								</Card>
							</UnstyledButton>
						);
					})}
				</SimpleGrid>
			</Modal>
		</>
	);
}
