'use client';

import { useQuery } from '@tanstack/react-query';
import { Anchor, Badge, Group, Skeleton, Text } from '@mantine/core';
import Link from 'next/link';
import { getGraduationRequestByStudentNo } from '@/server/graduation/requests/actions';

type GraduationViewProps = {
  stdNo: string;
  isActive: boolean;
};

export default function GraduationView({
  stdNo,
  isActive,
}: GraduationViewProps) {
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
    <Group gap='md'>
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
  );
}
