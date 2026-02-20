'use client';

import { Container, Stack } from '@mantine/core';
import { useCallback, useMemo, useRef, useState, useTransition } from 'react';

function computeInitialIndex(
	lecturers: Lecturer[],
	questions: Question[],
	existingResponses: ExistingResponse[]
) {
	const answered = new Set(
		existingResponses.map((r) => `${r.assignedModuleId}-${r.questionId}`)
	);
	for (let i = 0; i < lecturers.length; i++) {
		const allDone = questions.every((q) =>
			answered.has(`${lecturers[i].assignedModuleId}-${q.questionId}`)
		);
		if (!allDone) return i;
	}
	return lecturers.length;
}

import { submitLecturerFeedback } from '../_server/actions';
import LecturerNav from './LecturerNav';
import LecturerProgress from './LecturerProgress';
import LecturerStep from './LecturerStep';
import ThankYou from './ThankYou';

type Lecturer = {
	assignedModuleId: number;
	lecturerName: string | null;
	lecturerImage: string | null;
	moduleCode: string;
	moduleName: string;
};

type Question = {
	categoryId: string;
	categoryName: string;
	questionId: string;
	questionText: string;
};

type ExistingResponse = {
	assignedModuleId: number;
	questionId: string;
	rating: number | null;
	comment: string | null;
};

type Props = {
	passphraseId: string;
	cycleName: string;
	lecturers: Lecturer[];
	questions: Question[];
	existingResponses: ExistingResponse[];
};

type ResponseEntry = {
	rating: number | null;
	comment: string | null;
};

function responseKey(assignedModuleId: number, questionId: string) {
	return `${assignedModuleId}-${questionId}`;
}

export default function FeedbackForm({
	passphraseId,
	cycleName,
	lecturers,
	questions,
	existingResponses,
}: Props) {
	const [responses, setResponses] = useState<Map<string, ResponseEntry>>(() => {
		const map = new Map<string, ResponseEntry>();
		for (const r of existingResponses) {
			map.set(responseKey(r.assignedModuleId, r.questionId), {
				rating: r.rating,
				comment: r.comment,
			});
		}
		return map;
	});

	const completedLecturers = useMemo(() => {
		const set = new Set<number>();
		for (const lec of lecturers) {
			const allAnswered = questions.every((q) =>
				responses.has(responseKey(lec.assignedModuleId, q.questionId))
			);
			if (allAnswered) set.add(lec.assignedModuleId);
		}
		return set;
	}, [responses, lecturers, questions]);

	const [currentLecturerIndex, setCurrentLecturerIndex] = useState(() =>
		computeInitialIndex(lecturers, questions, existingResponses)
	);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const startTransition = useTransition()[1];

	const currentLecturer = lecturers[currentLecturerIndex];

	const isFirstQuestion = currentQuestionIndex === 0;
	const isLastQuestion = currentQuestionIndex === questions.length - 1;

	const touchStart = useRef<{ x: number; y: number } | null>(null);

	const onTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0];
		touchStart.current = { x: touch.clientX, y: touch.clientY };
	}, []);

	const onTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (!touchStart.current) return;
			const touch = e.changedTouches[0];
			const dx = touch.clientX - touchStart.current.x;
			const dy = touch.clientY - touchStart.current.y;
			const MIN_SWIPE = 50;
			if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > MIN_SWIPE) {
				if (dx < 0 && !isLastQuestion) {
					setCurrentQuestionIndex((i) => i + 1);
				} else if (dx > 0 && !isFirstQuestion) {
					setCurrentQuestionIndex((i) => i - 1);
				}
			}
			touchStart.current = null;
		},
		[isFirstQuestion, isLastQuestion]
	);

	const setResponse = useCallback(
		(assignedModuleId: number, questionId: string, entry: ResponseEntry) => {
			setResponses((prev) => {
				const next = new Map(prev);
				next.set(responseKey(assignedModuleId, questionId), entry);
				return next;
			});
		},
		[]
	);

	const getResponse = useCallback(
		(assignedModuleId: number, questionId: string) => {
			return responses.get(responseKey(assignedModuleId, questionId));
		},
		[responses]
	);

	if (!currentLecturer) {
		return <ThankYou cycleName={cycleName} ratedCount={lecturers.length} />;
	}

	const completedCount = Array.from(completedLecturers).length;

	function handleNavigateTo(index: number) {
		if (!currentLecturer) {
			setCurrentLecturerIndex(index);
			setCurrentQuestionIndex(0);
			return;
		}

		const lecturerResponses = questions
			.map((q) => {
				const r = responses.get(
					responseKey(currentLecturer.assignedModuleId, q.questionId)
				);
				return {
					questionId: q.questionId,
					rating: r?.rating ?? 0,
					comment: r?.comment ?? null,
				};
			})
			.filter((r) => r.rating > 0);

		startTransition(async () => {
			if (lecturerResponses.length > 0) {
				await submitLecturerFeedback(
					passphraseId,
					currentLecturer.assignedModuleId,
					lecturerResponses
				);
			}
			setCurrentLecturerIndex(index);
			setCurrentQuestionIndex(0);
		});
	}

	return (
		<Container
			size='xs'
			py='sm'
			px='sm'
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			style={{ minHeight: '100dvh' }}
		>
			<Stack gap='sm'>
				<LecturerProgress
					current={currentLecturerIndex + 1}
					total={lecturers.length}
					completedCount={completedCount}
				/>
				<LecturerStep
					lecturer={currentLecturer}
					questions={questions}
					currentQuestionIndex={currentQuestionIndex}
					onQuestionIndexChange={setCurrentQuestionIndex}
					getResponse={getResponse}
					setResponse={setResponse}
				/>
				<LecturerNav
					lecturers={lecturers}
					currentIndex={currentLecturerIndex}
					questions={questions}
					getResponse={getResponse}
					onNavigate={handleNavigateTo}
				/>
			</Stack>
		</Container>
	);
}
