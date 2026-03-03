'use client';
import {
	getActiveProgram,
	getCurrentSemester,
	getStudentByUserId,
} from '@registry/students';
import { getUnpublishedTermCodes } from '@registry/terms/settings/_server/actions';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';

export default function useUserStudent() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: student, isLoading: studentLoading } = useQuery({
		queryKey: ['student', session?.user?.id],
		queryFn: () => getStudentByUserId(session?.user?.id),
		staleTime: 1000 * 60 * 15,
		enabled: !!session?.user?.id,
	});

	const { data: unpublishedTerms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['unpublished-terms'],
		queryFn: getUnpublishedTermCodes,
	});

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		}
	}, [status, router]);

	const program = useMemo(() => {
		const p = getActiveProgram(student);
		if (!p || unpublishedTerms.length === 0) return p;
		const excludeSet = new Set(unpublishedTerms);
		return {
			...p,
			semesters: p.semesters.filter((s) => !excludeSet.has(s.termCode)),
		};
	}, [student, unpublishedTerms]);

	return {
		isLoading: status === 'loading' || studentLoading || termsLoading,
		user: session?.user,
		student,
		unpublishedTerms,
		program,
		remarks: getAcademicRemarks(student?.programs ?? [], unpublishedTerms),
		semester: getCurrentSemester(student, unpublishedTerms),
	};
}
