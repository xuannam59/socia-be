import { v4 as uuidv4 } from 'uuid';

export const convertSlug = (str: string) => {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from =
    'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆĞÍÌÎÏİŇÑÓÖÒÔÕØŘŔŠŞŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇğíìîïıňñóöòôõøðřŕšşťúůüùûýÿžþÞĐđßÆa·/_,:;';
  const to = 'AAAAAACCCDEEEEEEEEGIIIIINNOOOOOORRSSTUUUUUYYZaaaaaacccdeeeeeeeegiiiiinnooooooorrsstuuuuuyyzbBDdBAa------';
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
};

// Tối ưu cho performance và organization
export const generateS3Key = (filename: string, contentType: string, userId: string): string => {
  const uuid = uuidv4();
  const slug = convertSlug(filename);
  const ext = contentType.split('/')[1] || filename.split('.').pop();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const category = getFileCategory(contentType);

  return `${category}/${year}/${month}/${userId}_${uuid}/${slug}.${ext}`;
};

export const getFileCategory = (contentType: string) => {
  if (contentType.startsWith('image/')) return 'images';
  if (contentType.startsWith('video/')) return 'videos';
  if (contentType.startsWith('audio/')) return 'audios';
  if (contentType.startsWith('application/pdf')) return 'documents';
  return 'files';
};
