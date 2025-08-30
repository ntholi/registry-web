import { Card, CardSection, Flex, Group, Skeleton, Stack } from '@mantine/core';

export default function GraduationHistorySkeleton() {
  return (
    <Card withBorder>
      <CardSection p='xs'>
        <Flex gap='xs' align='center' justify='space-between'>
          <Group>
            <Skeleton height={32} width={32} radius='sm' />
            <Skeleton height={24} width={150} />
          </Group>
          <Skeleton height={20} width={60} radius='xl' />
        </Flex>
      </CardSection>

      <Flex justify={'space-between'} align={'center'}>
        <Stack gap='xs' mt='xs'>
          <Skeleton height={16} width={100} />
        </Stack>
      </Flex>

      <CardSection px='xs' mt='xs' py='xs' withBorder>
        <Flex gap='xs' align='center' justify='space-between'>
          <Skeleton height={12} width={150} />
          <Group>
            <Skeleton height={12} width={80} />
            <Skeleton height={16} width={16} radius='sm' />
          </Group>
        </Flex>
      </CardSection>
    </Card>
  );
}
