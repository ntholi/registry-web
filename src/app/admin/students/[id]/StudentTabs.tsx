'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getStudent } from '@/server/students/actions';
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
  isBlocked: boolean;
};

function BlockedStudentModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
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
      size='sm'
      centered
    >
      <Stack gap='md'>
        <Text>
          This student has been blocked and cannot have their statement of
          results printed.
        </Text>
        <Text size='sm' c='dimmed'>
          Please contact the registry office for more information about this
          restriction.
        </Text>
      </Stack>
    </Modal>
  );
}

export function StudentTabs({ student, session, isBlocked }: StudentTabsProps) {
  const [activeTab, setActiveTab] = useLocalStorage<string | null>(
    'studentDetailsTab',
    'academics',
  );
  const [
    blockedModalOpened,
    { open: openBlockedModal, close: closeBlockedModal },
  ] = useDisclosure(false);

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
            <BlockedAcademicsView student={student} showMarks />
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

      <BlockedStudentModal
        opened={blockedModalOpened}
        onClose={closeBlockedModal}
      />
    </>
  );
}
