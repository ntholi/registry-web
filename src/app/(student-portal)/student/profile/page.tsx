'use client';
import { Center, Container, Stack, Text } from '@mantine/core';
import AcademicInformation from '@/modules/student-portal/features/profile/components/AcademicInformation';
import PersonalInformation from '@/modules/student-portal/features/profile/components/PersonalInformation';
import ProfileHeader from '@/modules/student-portal/features/profile/components/ProfileHeader';
import ProfileSkeleton from '@/modules/student-portal/features/profile/components/ProfileSkeleton';
import SponsorshipInformation from '@/modules/student-portal/features/profile/components/SponsorshipInformation';
import useUserStudent from '@/shared/lib/hooks/use-user-student';

export default function Profile() {
	const { student, program, semester, remarks, isLoading } = useUserStudent();

	if (isLoading) {
		return <ProfileSkeleton />;
	}

	if (!student) {
		return (
			<Container size='md'>
				<Center>
					<Text size='lg' c='dimmed'>
						Unable to load student profile
					</Text>
				</Center>
			</Container>
		);
	}

	return (
		<Container size='md'>
			<Stack gap='xl'>
				<ProfileHeader student={student} />

				<PersonalInformation student={student} />

				<AcademicInformation
					program={program}
					semester={semester}
					remarks={remarks}
				/>

				<SponsorshipInformation studentNo={student.stdNo} />
			</Stack>
		</Container>
	);
}
