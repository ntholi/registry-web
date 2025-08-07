'use client';

import {
  Modal,
  Button,
  Group,
  FileButton,
  Stack,
  Text,
  Center,
  Box,
} from '@mantine/core';
import { useCallback, useRef, useState } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { IconUpload, IconPhoto } from '@tabler/icons-react';

type Props = {
  opened: boolean;
  onClose: () => void;
  onPhotoSubmit: (croppedImageBlob: Blob) => void;
  title?: string;
};

export default function PhotoInputModal({
  opened,
  onClose,
  onPhotoSubmit,
  title = 'Upload Photo',
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [initialCropSet, setInitialCropSet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;

      const size = Math.min(width, height);
      const x = (width - size) / 2;
      const y = (height - size) / 2;

      const newCrop = {
        unit: 'px' as const,
        x,
        y,
        width: size,
        height: size,
      };

      setCrop(newCrop);
      setCompletedCrop(newCrop);
      setInitialCropSet(true);
    },
    []
  );

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = 1000;
      canvas.height = 1000;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        1000,
        1000
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.9
        );
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setImageSrc('');
    setCrop({
      unit: '%',
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    });
    setCompletedCrop(null);
    setInitialCropSet(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      alert('Please select and crop an image');
      return;
    }

    setIsProcessing(true);

    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop
      );
      await onPhotoSubmit(croppedImageBlob);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, getCroppedImg, onPhotoSubmit]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size='xl'
      centered
      closeOnEscape
    >
      <Stack gap='md'>
        {!imageSrc ? (
          <Center>
            <Stack align='center' gap='md'>
              <IconPhoto size='3rem' color='gray' />
              <Text c='dimmed' ta='center'>
                Select an image to crop and resize
              </Text>
              <FileButton onChange={handleFileSelect} accept='image/*'>
                {(props) => (
                  <Button {...props} leftSection={<IconUpload size='1rem' />}>
                    Choose Image
                  </Button>
                )}
              </FileButton>
            </Stack>
          </Center>
        ) : (
          <>
            <Center>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                minWidth={50}
                minHeight={50}
              >
                <img
                  ref={imgRef}
                  alt='Crop preview'
                  src={imageSrc}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    display: 'block',
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </Center>

            <Group justify='center' mt='lg'>
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={isProcessing}>
                Upload Photo
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
