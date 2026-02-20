'use client';

import {
	Avatar,
	Box,
	Button,
	Divider,
	Group,
	Popover,
	Progress,
	Stack,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconCheck,
	IconChevronUp,
	IconSend,
	IconUsers,
} from '@tabler/icons-react';

type Lecturer = {
	assignedModuleId: number;
	lecturerName: string | null;
	lecturerImage: string | null;
	moduleCode: string;
	moduleName: string;
};

type Question = {
	questionId: string;
};

type ResponseEntry = {
	rating: number | null;
	comment: string | null;
};

type Props = {
	lecturers: Lecturer[];
	currentIndex: number;
	questions: Question[];
	getResponse: (
		assignedModuleId: number,
		questionId: string
	) => ResponseEntry | undefined;
	onNavigate: (index: number) => void;
	onSubmit: () => void;
	isLast: boolean;
	isPending: boolean;
	pendingAction: 'next' | 'skip' | null;
};

export default function LecturerNav({
	lecturers,
	currentIndex,
	questions,
	getResponse,
	onNavigate,
	onSubmit,
	isLast,
	isPending,
	pendingAction,
}: Props) {
	const [opened, { toggle, close }] = useDisclosure(false);

	function answeredCount(lec: Lecturer) {
		return questions.filter((q) =>
			getResponse(lec.assignedModuleId, q.questionId)
		).length;
	}

	return (
		<Popover
			opened={opened}
			onClose={close}
			position='top'
			width={340}
			shadow='lg'
			radius='md'
		>
			<Popover.Target>
				<Button
					variant='light'
					radius='xl'
					fullWidth
					leftSection={<IconUsers size={18} />}
					rightSection={<IconChevronUp size={14} />}
					onClick={toggle}
					size='md'
				>
					All Lecturers ({currentIndex + 1}/{lecturers.length})
				</Button>
			</Popover.Target>
			<Popover.Dropdown p='xs'>
				<Stack gap={4}>
					{lecturers.map((lec, idx) => {
						const answered = answeredCount(lec);
						const total = questions.length;
						const pct = total > 0 ? (answered / total) * 100 : 0;
						const isCurrent = idx === currentIndex;
						const isComplete = answered === total;

						return (
							<UnstyledButton
								key={lec.assignedModuleId}
								onClick={() => {
									onNavigate(idx);
									close();
								}}
								py={8}
								px='sm'
								style={(theme) => ({
									borderRadius: theme.radius.md,
									backgroundColor: isCurrent
										? 'var(--mantine-color-blue-light)'
										: undefined,
									transition: 'background-color 120ms ease',
									'&:hover': {
										backgroundColor: 'var(--mantine-color-default-hover)',
									},
								})}
							>
								<Group wrap='nowrap' gap='sm'>
									<Avatar
										src={lec.lecturerImage}
										size={36}
										radius='xl'
										color={isComplete ? 'green' : 'blue'}
									>
										{isComplete ? (
											<IconCheck size={18} />
										) : (
											lec.lecturerName
												?.split(' ')
												.map((n) => n[0])
												.join('')
												.slice(0, 2)
												.toUpperCase()
										)}
									</Avatar>
									<Box style={{ flex: 1, minWidth: 0 }}>
										<Text size='sm' fw={isCurrent ? 600 : 400} truncate>
											{lec.lecturerName}
										</Text>
										<Text size='xs' c='dimmed' truncate>
											{lec.moduleCode}
										</Text>
										<Progress
											value={pct}
											size={4}
											radius='xl'
											mt={4}
											color={isComplete ? 'green' : 'blue'}
										/>
									</Box>
									<Text size='xs' c='dimmed' fw={500}>
										{answered}/{total}
									</Text>
								</Group>
							</UnstyledButton>
						);
					})}
					<Divider my={4} />
					<Button
						onClick={() => {
							close();
							onSubmit();
						}}
						loading={isPending && pendingAction === 'next'}
						disabled={isPending && pendingAction !== 'next'}
						rightSection={<IconSend size={16} />}
						radius='xl'
						variant='filled'
						fullWidth
					>
						{isLast ? 'Submit All' : 'Next Lecturer'}
					</Button>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}
