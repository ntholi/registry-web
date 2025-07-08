'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getStudent } from '@/server/students/actions';
import { getBlockedStudentByStdNo } from '@/server/blocked-students/actions';
import {
  Box,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Button,
  Modal,
  Text,
  Group,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPrinter, IconExclamationCircle } from '@tabler/icons-react';
import { Session } from 'next-auth';
import AcademicsView from './AcademicsView';
import BlockedAcademicsView from './BlockedAcademicsView';
import RegistrationView from './RegistrationView';
import StatementOfResultsPrinter from './statements/StatementOfResultsPrinter';
import StudentView from './StudentView';

type StudentTabsProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  session: Session | null;
  blockedStudent: Awaited<ReturnType<typeof getBlockedStudentByStdNo>>;
};

function BlockedStudentModal({
  opened,
  onClose,
  blockedStudent,
}: {
  opened: boolean;
  onClose: () => void;
  blockedStudent: NonNullable<
    Awaited<ReturnType<typeof getBlockedStudentByStdNo>>
  >;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap='xs'>
          <IconExclamationCircle size={20} color='red' />
          <Text fw={500}>Student Blocked</Text>
        </Group>
      }
      size='md'
      centered
    >
      <Stack gap='md'>
        <Stack gap='xs'>
          <Group gap='xs'>
            <Text fw={500} size='sm'>
              Reason:
            </Text>
            <Text size='sm' c='red'>
              {blockedStudent.reason}
            </Text>
          </Group>
          <Group gap='xs'>
            <Text fw={500} size='sm'>
              Blocked by:
            </Text>
            <Text size='sm' c='dimmed'>
              {blockedStudent.byDepartment}
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}

export function StudentTabs({
  student,
  session,
  blockedStudent,
}: StudentTabsProps) {
  const [activeTab, setActiveTab] = useLocalStorage<string | null>(
    'studentDetailsTab',
    'academics',
  );
  const [
    blockedModalOpened,
    { open: openBlockedModal, close: closeBlockedModal },
  ] = useDisclosure(false);

  const isBlocked = !!blockedStudent;

  const showRegistration =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'registry' ||
    session?.user?.position === 'admin' ||
    session?.user?.position === 'manager' ||
    session?.user?.position === 'program_leader' ||
    session?.user?.position === 'year_leader';

  const showStatementOfResults =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'registry' ||
    session?.user?.position === 'admin' ||
    session?.user?.position === 'manager' ||
    session?.user?.position === 'program_leader';

  const handlePrintAttempt = () => {
    if (isBlocked) {
      openBlockedModal();
    }
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant='outline'
        mt={'xl'}
      >
        <TabsList>
          <TabsTab value='academics'>Academics</TabsTab>
          <TabsTab value='info'>Student</TabsTab>
          {showRegistration && (
            <TabsTab value='registration'>Registration</TabsTab>
          )}
          {showStatementOfResults && (
            <Box ml='auto'>
              {isBlocked ? (
                <Button
                  leftSection={<IconPrinter size='1rem' />}
                  variant='subtle'
                  color='red'
                  size='xs'
                  onClick={handlePrintAttempt}
                >
                  Statement of Results
                </Button>
              ) : (
                <StatementOfResultsPrinter student={student} />
              )}
            </Box>
          )}
        </TabsList>
        <TabsPanel value='academics' pt={'xl'} p={'sm'}>
          {isBlocked ? (
            <BlockedAcademicsView
              student={student}
              showMarks
              blockedStudent={blockedStudent}
            />
          ) : (
            <AcademicsView student={student} showMarks />
          )}
        </TabsPanel>
        <TabsPanel value='info' pt={'xl'} p={'sm'}>
          <StudentView student={student} />
        </TabsPanel>
        <TabsPanel value='registration' pt={'xl'} p={'sm'}>
          <RegistrationView
            stdNo={student.stdNo}
            isActive={activeTab === 'registration'}
          />
        </TabsPanel>
      </Tabs>

      {isBlocked && blockedStudent && (
        <BlockedStudentModal
          opened={blockedModalOpened}
          onClose={closeBlockedModal}
          blockedStudent={blockedStudent}
        />
      )}
    </>
  );
}
