'use client';
import { getStudent, getStudentPhoto } from '@/server/students/actions';
import { uploadDocument, deleteDocument } from '@/lib/storage';
import { Card, Image, Center, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { IconUser, IconEdit, IconUpload } from '@tabler/icons-react';
import PhotoInputModal from './PhotoInputModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import { useSession } from 'next-auth/react';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

export default function PhotoView({ student }: Props) {
  const [
    uploadModalOpened,
    { open: openUploadModal, close: closeUploadModal },
  ] = useDisclosure(false);
  const { data: photoUrl, refetch } = useQuery({
    queryKey: ['studentPhoto', student.stdNo],
    queryFn: () => getStudentPhoto(student.stdNo),
    staleTime: 1000 * 60 * 3,
  });
  const { data: session } = useSession();

  const handlePhotoSubmit = async (croppedImageBlob: Blob) => {
    if (photoUrl) {
      await deleteDocument(photoUrl);
    }

    const fileName = `${student.stdNo}.jpg`;
    const photoFile = new File([croppedImageBlob], fileName, {
      type: 'image/jpeg',
    });

    await uploadDocument(photoFile, fileName);
    await refetch();
    closeUploadModal();
  };

  const cardContent = (
    <Center h='100%'>
      <IconUser size='2rem' />
    </Center>
  );

  return (
    <>
      <PhotoInputModal
        opened={uploadModalOpened}
        onClose={closeUploadModal}
        onPhotoSubmit={handlePhotoSubmit}
        title={`Upload Photo for ${student.name}`}
      />

      <div style={{ position: 'relative' }}>
        {photoUrl ? (
          <PhotoPreviewModal
            photoUrl={photoUrl}
            title={`${student.name} (${student.stdNo})`}
            alt='Student photo'
            width={77}
            height={77}
          />
        ) : (
          <>
            <Card withBorder radius={'md'} w={76} h={76} p={'xs'}>
              {cardContent}
            </Card>
            {['admin', 'registry'].includes(session?.user?.role ?? '') && (
              <ActionIcon
                size='sm'
                style={{
                  position: 'absolute',
                  opacity: 0.7,
                  top: 4,
                  right: 4,
                  zIndex: 1,
                }}
                onClick={openUploadModal}
                title={photoUrl ? 'Change photo' : 'Upload photo'}
              >
                <IconUpload size='0.8rem' />
              </ActionIcon>
            )}
          </>
        )}
      </div>
    </>
  );
}
