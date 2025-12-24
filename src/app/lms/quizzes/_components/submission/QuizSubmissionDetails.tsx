'use client';

import {
	Avatar,
	Box,
	Group,
	Loader,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconClipboardList,
	IconInfoCircle,
	IconMessageCircle,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import StudentAvatar from '@/modules/lms/shared/StudentAvatar';
import { getQuizAttemptDetails } from '../../_server/actions';
import type { QuizSubmissionUser } from '../../types';
import QuizAttemptSelector from './QuizAttemptSelector';
import QuizAttemptSummary from './QuizAttemptSummary';
import QuizFeedbackPanel from './QuizFeedbackPanel';
import QuizQuestionReview from './QuizQuestionReview';

type Props = {
	selectedUser: QuizSubmissionUser | null;
	quizId: number;
	maxGrade: number;
};

export default function QuizSubmissionDetails({
	selectedUser,
	quizId,
	maxGrade,
}: Props) {
	const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(
		null
	);
	const [activeTab, setActiveTab] = useState<string | null>('summary');

	useEffect(() => {
		if (selectedUser?.attempts?.length) {
			const finishedAttempts = selectedUser.attempts.filter(
				(a) => a.state === 'finished'
			);
			const defaultAttempt =
				selectedUser.bestAttempt ||
				finishedAttempts[0] ||
				selectedUser.attempts[0];
			setSelectedAttemptId(defaultAttempt?.id ?? null);
		} else {
			setSelectedAttemptId(null);
		}
	}, [selectedUser]);

	const { data: attemptDetails, isLoading: isLoadingDetails } = useQuery({
		queryKey: ['quiz-attempt-details', selectedAttemptId],
		queryFn: () =>
			selectedAttemptId ? getQuizAttemptDetails(selectedAttemptId) : null,
		enabled: !!selectedAttemptId,
	});

	if (!selectedUser) {
		return (
			<Stack align='center' py='xl'>
				<ThemeIcon size={60} variant='light' color='gray'>
					<IconUsers size={30} />
				</ThemeIcon>
				<Text c='dimmed' size='sm'>
					Select a student to view their submissions
				</Text>
			</Stack>
		);
	}

	const displayName = selectedUser.dbStudent?.name ?? selectedUser.fullname;
	const hasAttempts = selectedUser.attempts.length > 0;

	if (!hasAttempts) {
		return (
			<Stack gap='md'>
				<Group gap='sm'>
					{selectedUser.dbStudent ? (
						<StudentAvatar
							stdNo={selectedUser.dbStudent.stdNo}
							size='md'
							radius='xl'
						/>
					) : (
						<Avatar src={selectedUser.profileimageurl} size='md' radius='xl' />
					)}
					<Box>
						<Text fw={600}>{displayName}</Text>
						<Text size='xs' c='dimmed'>
							No attempts yet
						</Text>
					</Box>
				</Group>

				<Stack align='center' py='xl'>
					<ThemeIcon size={60} variant='light' color='gray'>
						<IconClipboardList size={30} />
					</ThemeIcon>
					<Text c='dimmed' size='sm'>
						This student has not attempted the quiz yet.
					</Text>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Group gap='sm'>
					{selectedUser.dbStudent ? (
						<StudentAvatar
							stdNo={selectedUser.dbStudent.stdNo}
							size='md'
							radius='xl'
						/>
					) : (
						<Avatar src={selectedUser.profileimageurl} size='md' radius='xl' />
					)}
					<Box>
						<Text fw={600}>{displayName}</Text>
						<Text size='xs' c='dimmed'>
							{selectedUser.attempts.length} attempt
							{selectedUser.attempts.length !== 1 ? 's' : ''}
						</Text>
					</Box>
				</Group>

				<QuizAttemptSelector
					attempts={selectedUser.attempts}
					selectedAttemptId={selectedAttemptId}
					onSelectAttempt={setSelectedAttemptId}
					maxGrade={maxGrade}
				/>
			</Group>

			{isLoadingDetails ? (
				<Stack align='center' py='xl'>
					<Loader size='md' />
					<Text c='dimmed' size='sm'>
						Loading attempt details...
					</Text>
				</Stack>
			) : attemptDetails ? (
				<Tabs value={activeTab} onChange={setActiveTab} variant='outline'>
					<TabsList>
						<TabsTab value='summary' leftSection={<IconInfoCircle size={16} />}>
							Summary
						</TabsTab>
						<TabsTab
							value='questions'
							leftSection={<IconClipboardList size={16} />}
						>
							Questions ({attemptDetails.questions.length})
						</TabsTab>
						<TabsTab
							value='feedback'
							leftSection={<IconMessageCircle size={16} />}
						>
							Feedback
						</TabsTab>
					</TabsList>

					<TabsPanel value='summary' pt='md'>
						<QuizAttemptSummary attempt={attemptDetails} maxGrade={maxGrade} />
					</TabsPanel>

					<TabsPanel value='questions' pt='md'>
						<Stack gap='md'>
							{attemptDetails.questions.map((question) => (
								<QuizQuestionReview
									key={question.slot}
									question={question}
									attemptId={attemptDetails.id}
									quizId={quizId}
								/>
							))}
						</Stack>
					</TabsPanel>

					<TabsPanel value='feedback' pt='md'>
						<QuizFeedbackPanel attemptId={attemptDetails.id} quizId={quizId} />
					</TabsPanel>
				</Tabs>
			) : (
				<Stack align='center' py='xl'>
					<Text c='dimmed' size='sm'>
						Unable to load attempt details.
					</Text>
				</Stack>
			)}
		</Stack>
	);
}
