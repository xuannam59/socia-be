import { hashSync, compareSync } from 'bcrypt';
const saltRounds = 10;

export const hashPassword = (password: string): string | undefined => {
  try {
    return hashSync(password, saltRounds);
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export const comparePassword = (password: string, hash: string): boolean | undefined => {
  try {
    return compareSync(password, hash);
  } catch (error) {
    console.log(error);
    return undefined;
  }
};
