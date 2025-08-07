import { Card, Stack, Skeleton } from '@mantine/core';

export default function NewRegistrationCardSkeleton() {
  return (
    <Card withBorder>
      <Stack align='center' gap='md'>
        <Skeleton height={48} width={48} radius='sm' />
        <Stack align='center' gap='xs'>
          <Skeleton height={24} width={200} />
          <Stack align='center' gap='xs'>
            <Skeleton height={16} width={280} />
            <Skeleton height={16} width={240} />
            <Skeleton height={16} width={260} />
          </Stack>
        </Stack>
        <Skeleton height={36} width={140} radius='sm' />
      </Stack>
    </Card>
  );
}
