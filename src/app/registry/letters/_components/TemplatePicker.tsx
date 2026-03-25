'use client';

import {
	Badge,
	Box,
	Card,
	Group,
	Input,
	Modal,
	Paper,
	Popover,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileText, IconLock } from '@tabler/icons-react';
import { resolveTemplate } from '../_lib/resolve';
import { evaluateRestrictions, type Restriction } from '../_lib/restrictions';
import type { getStudentForLetter } from '../_server/actions';

type Template = {
	id: string;
	name: string;
	subject: string | null;
	role: string | null;
	restrictions: Restriction[] | null;
};

type StudentData = NonNullable<Awaited<ReturnType<typeof getStudentForLetter>>>;

type Props = {
	templates: Template[];
	value: string | null;
	onChange: (id: string | null) => void;
	studentData?: StudentData | null;
};

function getTemplateRestriction(
	tpl: Template,
	studentData: StudentData | null | undefined
): string | null {
	if (!studentData) return null;
	if (!tpl.restrictions?.length) return null;
	return evaluateRestrictions(tpl.restrictions, studentData);
}

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
						style={(_theme) => ({
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
						const restriction = getTemplateRestriction(tpl, studentData);
						const isRestricted = !!restriction;

						const card = (
							<Card
								withBorder
								padding='lg'
								radius='md'
								style={(theme) => ({
									borderColor: isRestricted
										? theme.colors.gray[4]
										: value === tpl.id
											? theme.colors.blue[6]
											: undefined,
									borderWidth: value === tpl.id ? 2 : 1,
									transition: 'border-color 150ms, box-shadow 150ms',
									height: '100%',
									cursor: isRestricted ? 'not-allowed' : 'pointer',
									opacity: isRestricted ? 0.5 : 1,
								})}
							>
								<Stack gap='xs'>
									<Group justify='space-between'>
										<ThemeIcon
											variant='light'
											size='xl'
											radius='md'
											color={
												isRestricted
													? 'gray'
													: value === tpl.id
														? 'blue'
														: 'gray'
											}
										>
											<IconFileText size={22} />
										</ThemeIcon>
										{isRestricted && (
											<ThemeIcon
												variant='light'
												size='sm'
												radius='xl'
												color='red'
											>
												<IconLock size={14} />
											</ThemeIcon>
										)}
									</Group>
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
									{isRestricted && (
										<Text size='xs' c='red' lineClamp={2}>
											{restriction}
										</Text>
									)}
									{tpl.role && (
										<Badge size='xs' variant='light' w='fit-content'>
											{tpl.role}
										</Badge>
									)}
								</Stack>
							</Card>
						);

						if (isRestricted) {
							return (
								<Popover key={tpl.id} position='top' withArrow>
									<Popover.Target>
										<Box>{card}</Box>
									</Popover.Target>
									<Popover.Dropdown>
										<Text size='xs'>{restriction}</Text>
									</Popover.Dropdown>
								</Popover>
							);
						}

						return (
							<UnstyledButton
								key={tpl.id}
								onClick={() => {
									onChange(tpl.id);
									close();
								}}
							>
								{card}
							</UnstyledButton>
						);
					})}
				</SimpleGrid>
			</Modal>
		</>
	);
}
