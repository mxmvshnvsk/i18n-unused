import { readdir } from 'fs/promises';
import { readFileSync } from 'fs';

import path from 'path';

export const getFileSizeKb = (str: string): number => Buffer.byteLength(str, 'utf8') / 1000;

export const isSubstrInFile = (filePath: string, substr: string): boolean => {
  const file = readFileSync(filePath).toString();

  return file.includes(substr);
};

export const generateFilesPaths = async (dir: string, allowedFileTypes: string | string[]): Promise<string | string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });

  const files = await Promise.all(entries.map((dirent: any) => {
    const nextPath: string = path.resolve(dir, dirent.name);

    return dirent.isDirectory() ? generateFilesPaths(nextPath, allowedFileTypes) : nextPath;
  }));

  return Array.prototype.concat(...files).filter((v) => (
    allowedFileTypes.includes(path.extname(v).split('.')[1])
  ));
}
