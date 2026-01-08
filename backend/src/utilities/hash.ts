import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hash = async (data: string): Promise<string> => await bcrypt.hash(data, SALT_ROUNDS);

export const compareHash = async (data: string, hashedData: string): Promise<boolean> => await bcrypt.compare(data, hashedData);