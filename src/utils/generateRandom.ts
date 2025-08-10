export const generateRandom = (length: number) => {
  const char = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let string = '';
  for (let i = 0; i < length; i++) {
    string += char[Math.floor(Math.random() * char.length)];
  }
  return string;
};

export const generateRandomNumber = (length: number) => {
  const char = '0123456789';
  let string = '';
  for (let i = 0; i < length; i++) {
    string += char[Math.floor(Math.random() * char.length)];
  }
  return string;
};
