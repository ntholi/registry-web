'use client';
import { Container, Stack, Text, Center } from '@mantine/core';
import useUserStudent from '@/hooks/use-user-student';
import ProfileHeader from './ProfileHeader';
import PersonalInformation from './PersonalInformation';
import AcademicInformation from './AcademicInformation';
import ProfileSkeleton from './ProfileSkeleton';

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
      </Stack>
    </Container>
  );
}
