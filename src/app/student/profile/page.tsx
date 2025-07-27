'use client';
import { Container, Stack, LoadingOverlay, Text, Center } from '@mantine/core';
import useUserStudent from '@/hooks/use-user-student';
import ProfileHeader from './ProfileHeader';
import PersonalInformation from './PersonalInformation';
import AcademicInformation from './AcademicInformation';

export default function Profile() {
  const { student, program, semester, remarks, isLoading } = useUserStudent();

  if (isLoading) {
    return (
      <Container size='lg' py='xl'>
        <div style={{ position: 'relative', minHeight: 400 }}>
          <LoadingOverlay visible={true} />
        </div>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container size='lg' py='xl'>
        <Center>
          <Text size='lg' c='dimmed'>
            Unable to load student profile
          </Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size='lg' py='xl'>
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
