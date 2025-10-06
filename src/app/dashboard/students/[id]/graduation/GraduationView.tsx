'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Skeleton,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
} from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import { getGraduationRequestByStudentNo } from '@/server/graduation/requests/actions';
import { getBlockedStudentByStdNo } from '@/server/blocked-students/actions';
import { getAcademicHistory } from '@/server/students/actions';
import TranscriptPreview from './transcript/TranscriptPreview';
import TranscriptPrinter from './transcript/TranscriptPrinter';

type GraduationViewProps = {
  stdNo: number | string;
  isActive: boolean;
  blockedStudent?: Awaited<ReturnType<typeof getBlockedStudentByStdNo>>;
};

type GraduationRequest = Awaited<
  ReturnType<typeof getGraduationRequestByStudentNo>
>;

type StudentProgram = {
  status?: string;
};

export default function GraduationView({
  stdNo,
  isActive,
  blockedStudent,
}: GraduationViewProps) {
  const [activeTab, setActiveTab] = useState<string | null>('transcript');
  const stdNoNum = Number(stdNo);

  const { data: graduationRequest, isLoading } = useQuery({
    queryKey: ['graduationRequest', stdNoNum],
    queryFn: () => getGraduationRequestByStudentNo(stdNoNum),
    enabled: isActive,
  });

  const { data: student, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student', stdNoNum],
    queryFn: () => getAcademicHistory(stdNoNum, true),
    enabled: isActive,
  });

  if (isLoading) {
    return (
      <Group gap='md'>
        <Skeleton height={24} width={80} />
        <Skeleton height={20} width={100} />
      </Group>
    );
  }

  const completedPrograms = (
    (student?.programs as StudentProgram[]) || []
  ).filter((p) => p && p.status === 'Completed');

  return (
    <Box>
      <RequestCard request={graduationRequest} />

      {completedPrograms && completedPrograms.length > 0 && (
        <Tabs value={activeTab} onChange={setActiveTab} variant='default'>
          <TabsList>
            <TabsTab value='transcript'>Transcript</TabsTab>
            <TabsTab value='certificate'>Certificate</TabsTab>
            {activeTab === 'transcript' && (
              <Box ml='auto'>
                <TranscriptPrinter
                  stdNo={stdNoNum}
                  disabled={!!blockedStudent}
                />
              </Box>
            )}
          </TabsList>
          <TabsPanel value='transcript' pt='xl'>
            <TranscriptPreview
              stdNo={stdNoNum}
              isActive={isActive && activeTab === 'transcript'}
            />
          </TabsPanel>
          <TabsPanel value='certificate' pt='xl'>
            <Text c='dimmed'>Certificate view coming soon</Text>
          </TabsPanel>
        </Tabs>
      )}
    </Box>
  );
}

function RequestCard({ request }: { request?: GraduationRequest | null }) {
  function getGraduationStatus(req?: GraduationRequest | null) {
    const clearances = req?.graduationClearances || [];
    if (clearances.length === 0) return 'pending';

    const hasRejected = clearances.some(
      (gc) => gc.clearance.status === 'rejected'
    );
    if (hasRejected) return 'rejected';

    const allApproved = clearances.every(
      (gc) => gc.clearance.status === 'approved'
    );
    if (allApproved) return 'approved';

    return 'pending';
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  }

  const status = getGraduationStatus(request);

  if (!request) {
    return (
      <Card withBorder p='md' mb='lg'>
        <Text size='sm' fw={500}>
          No graduation request
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder p='md' mb='lg'>
      <Group justify='space-between' align='center'>
        <Group>
          <Text size='sm' fw={500}>
            Graduation status
          </Text>
          <Badge color={getStatusColor(status)} size='xs'>
            {status}
          </Badge>
        </Group>
        {request && (
          <Button
            component={Link}
            href={`/dashboard/graduation/requests/${status}/${request.id}`}
            size='xs'
            variant='light'
            color='blue'
          >
            View Details
          </Button>
        )}
      </Group>
    </Card>
  );
}
