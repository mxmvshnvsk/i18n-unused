import { tsImport } from 'ts-import';

import { readdir } from 'fs/promises';
import { readFileSync } from 'fs';

import path from 'path';

import { ModuleResolver, ModuleNameResolver } from '../types';

export const getFileSizeKb = (str: string): number => Buffer.byteLength(str, 'utf8') / 1000;

export const isSubstrInFile = (filePath: string, substr: string): boolean => {
  const file = readFileSync(filePath).toString();

  return file.includes(substr);
};

export const resolveFile = async (filePath: string, resolver: ModuleResolver = (m) => m): Promise<any> => {
  const [, ext] = filePath.match(/\.([0-9a-z]+)(?:[?#]|$)/i) || [];
  let m = {};

  if (ext === 'ts') {
    m = await tsImport.compile(filePath);
  } else if (ext === 'js') {
    const r = require('esm')(module/*, options*/)
    m = r(filePath);
  } else if (ext === 'json') {
    m = require(filePath);
  }

  return resolver(m);
};

export const generateFilesPaths = async (
  dir: string,
  fileNameResolver: string[] | ModuleNameResolver,
): Promise<string | string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });

  const files = await Promise.all(entries.map((dirent: any) => {
    const nextPath: string = path.resolve(dir, dirent.name);

    return dirent.isDirectory() ? generateFilesPaths(nextPath, fileNameResolver) : nextPath;
  }));

  return Array.prototype.concat(...files).filter((v) => {
    const name = path.basename(v)

    if (fileNameResolver instanceof RegExp) {
      return fileNameResolver.test(name);
    }
    if (typeof fileNameResolver === 'function') {
      return fileNameResolver(name)
    }

    const [, ext] = name.match(/\.([0-9a-z]+)(?:[?#]|$)/i) || [];

    return fileNameResolver.includes(ext);
  });
}
