'use client';
import {
	getActiveProgram,
	getCurrentSemester,
	getStudentByUserId,
} from '@registry/students';
import { getUnpublishedTermCodes } from '@registry/terms/_server/settings-actions';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';

export default function useUserStudent() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: student, isLoading } = useQuery({
		queryKey: ['student', session?.user?.id],
		queryFn: () => getStudentByUserId(session?.user?.id),
		staleTime: 1000 * 60 * 15,
		enabled: !!session?.user?.id,
	});

	const { data: unpublishedTerms = [] } = useQuery({
		queryKey: ['unpublished-terms'],
		queryFn: getUnpublishedTermCodes,
	});

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
		}
	}, [status, router]);

	return {
		isLoading: status === 'loading' || isLoading,
		user: session?.user,
		student,
		program: getActiveProgram(student),
		remarks: getAcademicRemarks(student?.programs ?? [], unpublishedTerms),
		semester: getCurrentSemester(student),
	};
}
