'use client';
import { getStudent, getStudentPhoto } from '@/server/students/actions';
import { uploadDocument } from '@/lib/storage';
import {
  Card,
  Image,
  Modal,
  UnstyledButton,
  Center,
  ActionIcon,
  Group,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { IconUser, IconEdit, IconUpload } from '@tabler/icons-react';
import PhotoInputModal from './PhotoInputModal';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

export default function PhotoView({ student }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [
    uploadModalOpened,
    { open: openUploadModal, close: closeUploadModal },
  ] = useDisclosure(false);
  const { data: photoUrl, refetch } = useQuery({
    queryKey: ['studentPhoto', student.stdNo],
    queryFn: () => getStudentPhoto(student.stdNo),
    staleTime: 1000 * 60 * 3,
  });

  const handlePhotoSubmit = async (croppedImageBlob: Blob) => {
    const fileName = `${student.stdNo}.jpg`;
    const photoFile = new File([croppedImageBlob], fileName, {
      type: 'image/jpeg',
    });

    await uploadDocument(photoFile, fileName);
    await refetch();
    closeUploadModal();
  };

  const cardContent = photoUrl ? (
    <Card.Section>
      <Image
        src={photoUrl}
        alt='Student photo'
        w='100%'
        h='100%'
        fit='cover'
        radius={0}
        style={{ border: '1px solid #000' }}
      />
    </Card.Section>
  ) : (
    <Center h='100%'>
      <IconUser size='2rem' />
    </Center>
  );

  return (
    <>
      {photoUrl && (
        <Modal
          title={`${student.name} (${student.stdNo})`}
          opened={opened}
          onClose={close}
          size='lg'
          radius='md'
          centered
        >
          <Center>
            <Image
              src={photoUrl}
              alt='Student photo'
              fit='contain'
              h={'100%'}
              radius={'md'}
              w={'98%'}
            />
          </Center>
          <Group justify='center' mt='md'>
            <ActionIcon
              variant='filled'
              size='lg'
              onClick={openUploadModal}
              title='Upload new photo'
            >
              <IconEdit size='1.2rem' />
            </ActionIcon>
          </Group>
        </Modal>
      )}

      <PhotoInputModal
        opened={uploadModalOpened}
        onClose={closeUploadModal}
        onPhotoSubmit={handlePhotoSubmit}
        title={`Upload Photo for ${student.name}`}
      />

      <div style={{ position: 'relative' }}>
        {photoUrl ? (
          <UnstyledButton onClick={open}>
            <Card withBorder radius={'md'} w={77} h={77} p={'xs'}>
              {cardContent}
            </Card>
          </UnstyledButton>
        ) : (
          <Card withBorder radius={'md'} w={77} h={77} p={'xs'}>
            {cardContent}
          </Card>
        )}

        <ActionIcon
          variant='default'
          size='sm'
          style={{
            position: 'absolute',
            opacity: 0.7,
            top: 2,
            right: 2,
            zIndex: 1,
          }}
          onClick={openUploadModal}
          title={photoUrl ? 'Change photo' : 'Upload photo'}
        >
          <IconUpload size='0.8rem' />
        </ActionIcon>
      </div>
    </>
  );
}
