'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getBlockedStudentByStdNo } from '@/server/blocked-students/actions';
import { getStudent } from '@/server/students/actions';
import { Box, Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { Session } from 'next-auth';
import AcademicsView from './AcademicsView';
import BlockedAcademicsView from './AcademicsView/BlockedAcademicsView';
import StatementOfResultsPrinter from './AcademicsView/statements/StatementOfResultsPrinter';
import ProofOfRegistrationPrinter from './registration/proof/ProofOfRegistrationPrinter';
import RegistrationView from './registration/RegistrationView';
import StudentCardView from './card/StudentCardView';
import StudentView from './info/StudentView';

type StudentTabsProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  session: Session | null;
  blockedStudent: Awaited<ReturnType<typeof getBlockedStudentByStdNo>>;
};

export function StudentTabs({
  student,
  session,
  blockedStudent,
}: StudentTabsProps) {
  const [activeTab, setActiveTab] = useLocalStorage<string | null>(
    'studentDetailsTab',
    'info'
  );
  const showRegistration =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'registry' ||
    session?.user?.role === 'finance' ||
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

  const showStudentCard =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'registry' ||
    session?.user?.position === 'admin' ||
    session?.user?.position === 'manager';

  return (
    <Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt={'xl'}>
      <TabsList>
        <TabsTab value='academics'>Academics</TabsTab>
        <TabsTab value='info'>Student</TabsTab>
        {showRegistration && (
          <TabsTab value='registration'>Registration</TabsTab>
        )}
        {showStudentCard && <TabsTab value='studentcard'>Student Card</TabsTab>}
        {showStatementOfResults && activeTab === 'academics' && (
          <Box ml='auto'>
            <StatementOfResultsPrinter
              stdNo={student.stdNo}
              disabled={!!blockedStudent}
            />
          </Box>
        )}
        {showRegistration &&
          activeTab === 'registration' &&
          (session?.user?.role === 'registry' ||
            session?.user?.role === 'admin') && (
            <Box ml='auto'>
              <ProofOfRegistrationPrinter stdNo={student.stdNo} />
            </Box>
          )}
      </TabsList>
      <TabsPanel value='academics' pt={'xl'} p={'sm'}>
        {blockedStudent ? (
          <BlockedAcademicsView
            student={student}
            showMarks
            blockedStudent={blockedStudent}
          />
        ) : (
          <AcademicsView
            stdNo={student.stdNo}
            showMarks
            isActive={activeTab === 'academics'}
          />
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
      <TabsPanel value='studentcard' pt={'xl'} p={'sm'}>
        <StudentCardView
          student={student}
          isActive={activeTab === 'studentcard'}
        />
      </TabsPanel>
    </Tabs>
  );
}
