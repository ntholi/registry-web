import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getStudentByUserId } from '@/modules/registry/features/students/server/actions';
import {
	getActiveProgram,
	getCurrentSemester,
} from '@/modules/registry/features/students/utils';
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

	if (status === 'unauthenticated') {
		router.push('/login');
	}

	return {
		isLoading: status === 'loading' || isLoading,
		user: session?.user,
		student,
		program: getActiveProgram(student),
		remarks: getAcademicRemarks(student?.programs ?? []),
		semester: getCurrentSemester(student),
	};
}
