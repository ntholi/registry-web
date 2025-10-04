'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Anchor,
  Badge,
  Box,
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
import TranscriptPreview from './transcript/TranscriptPreview';
import TranscriptPrinter from './transcript/TranscriptPrinter';

type GraduationViewProps = {
  stdNo: string;
  isActive: boolean;
  blockedStudent?: Awaited<ReturnType<typeof getBlockedStudentByStdNo>>;
};

export default function GraduationView({
  stdNo,
  isActive,
  blockedStudent,
}: GraduationViewProps) {
  const [activeTab, setActiveTab] = useState<string | null>('transcript');

  const { data: graduationRequest, isLoading } = useQuery({
    queryKey: ['graduationRequest', stdNo],
    queryFn: () => getGraduationRequestByStudentNo(Number(stdNo)),
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

  if (!graduationRequest) {
    return (
      <Text size='sm' c='dimmed'>
        No graduation request
      </Text>
    );
  }

  function getGraduationStatus() {
    const clearances = graduationRequest?.graduationClearances || [];
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

  const status = getGraduationStatus();

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

  return (
    <Box>
      <Group gap='md' mb='xl'>
        <Badge color={getStatusColor(status)} tt='capitalize'>
          {status}
        </Badge>
        <Anchor
          component={Link}
          href={`/dashboard/graduation/requests/${status}/${graduationRequest.id}`}
          size='sm'
        >
          View Details
        </Anchor>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} variant='outline'>
        <TabsList>
          <TabsTab value='transcript'>Transcript</TabsTab>
          <TabsTab value='certificate'>Certificate</TabsTab>
          {activeTab === 'transcript' && (
            <Box ml='auto'>
              <TranscriptPrinter
                stdNo={Number(stdNo)}
                disabled={!!blockedStudent}
              />
            </Box>
          )}
        </TabsList>
        <TabsPanel value='transcript' pt='xl'>
          <TranscriptPreview
            stdNo={Number(stdNo)}
            isActive={isActive && activeTab === 'transcript'}
          />
        </TabsPanel>
        <TabsPanel value='certificate' pt='xl'>
          <Text c='dimmed'>Certificate view coming soon</Text>
        </TabsPanel>
      </Tabs>
    </Box>
  );
}
