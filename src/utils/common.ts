import { v4 as uuidv4 } from 'uuid';

export const convertSlug = (str: string) => {
  if (!str) return '';

  return str
    .normalize('NFD')
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/ /g, '-')
    .replace(/[:!@#$%^&*()?;/]/g, '')
    .replace(/^-+|-+$/g, '');
};

// Tối ưu cho performance và organization
export const generateS3Key = (filename: string, contentType: string, userId: string): string => {
  const uuid = uuidv4();
  const ext = contentType.split('/')[1] || filename.split('.').pop();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const category = getFileCategory(contentType);

  return `${category}/${userId}/${year}/${month}/${uuid}.${ext}`;
};

export const getFileCategory = (contentType: string) => {
  if (contentType.startsWith('image/')) return 'images';
  if (contentType.startsWith('video/')) return 'videos';
  if (contentType.startsWith('audio/')) return 'audios';
  if (contentType.startsWith('application/pdf')) return 'documents';
  return 'files';
};
