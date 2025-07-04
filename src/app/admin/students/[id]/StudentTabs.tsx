'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getStudent } from '@/server/students/actions';
import { Box, Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { Session } from 'next-auth';
import AcademicsView from './AcademicsView';
import RegistrationView from './RegistrationView';
import StatementOfResultsPrinter from './statements/StatementOfResultsPrinter';
import StudentView from './StudentView';

type StudentTabsProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  session: Session | null;
};

export function StudentTabs({ student, session }: StudentTabsProps) {
  const [activeTab, setActiveTab] = useLocalStorage<string | null>(
    'studentDetailsTab',
    'academics',
  );
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

  return (
    <Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt={'xl'}>
      <TabsList>
        <TabsTab value='academics'>Academics</TabsTab>
        <TabsTab value='info'>Student</TabsTab>
        {showRegistration && (
          <TabsTab value='registration'>Registration</TabsTab>
        )}
        {showStatementOfResults && (
          <Box ml='auto'>
            <StatementOfResultsPrinter student={student} />
          </Box>
        )}
      </TabsList>
      <TabsPanel value='academics' pt={'xl'} p={'sm'}>
        <AcademicsView student={student} showMarks />
      </TabsPanel>
      <TabsPanel value='info' pt={'xl'} p={'sm'}>
        <StudentView student={student} />
      </TabsPanel>
      <TabsPanel value='registration' pt={'xl'} p={'sm'}>
        <RegistrationView stdNo={student.stdNo} />
      </TabsPanel>
    </Tabs>
  );
}
