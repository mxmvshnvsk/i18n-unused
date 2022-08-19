import { tsImport } from 'ts-import';

import { createRequire } from 'module';

import { readFileSync, Dirent, promises as FsPromises } from 'fs';

import path from 'path';

import {
  ModuleResolver,
  ModuleNameResolver,
  RecursiveStruct,
  CustomFileLoader,
} from '../types';

export const getFileSizeKb = (str: string): number =>
  Buffer.byteLength(str, 'utf8') / 1000;

export const isSubstrInFile = (filePath: string, substr: string): boolean => {
  const file = readFileSync(filePath).toString();

  return file.includes(substr);
};

export const resolveFile = async (
  filePath: string,
  resolver: ModuleResolver = (m) => m,
  loader?: CustomFileLoader,
): Promise<RecursiveStruct> => {
  const [, ext] = filePath.match(/\.([0-9a-z]+)(?:[?#]|$)/i) || [];
  let m = {};

  if (loader) {
    m = loader(filePath);
  } else if (ext === 'ts') {
    m = await tsImport.compile(filePath);
  } else if (ext === 'js') {
    let r = createRequire(import.meta.url);
    r = r('esm')(m /*, options*/);
    m = r(filePath);
  } else if (ext === 'json') {
    const r = createRequire(import.meta.url);
    m = r(filePath);
  }

  return resolver(m);
};

const useFileNameResolver = (
  resolver: ModuleNameResolver,
  name: string,
): boolean => {
  if (resolver instanceof RegExp) {
    return resolver.test(name);
  }
  if (typeof resolver === 'function') {
    return resolver(name);
  }

  return false;
};

interface options {
  basePath?: string;
  ignorePaths?: string[];
  srcExtensions?: string[];
  fileNameResolver?: ModuleNameResolver;
}

export const generateFilesPaths = async (
  srcPath: string,
  { basePath, ignorePaths, srcExtensions, fileNameResolver }: options,
): Promise<string[]> => {
  // Dirent: https://nodejs.org/api/fs.html#class-fsdirent
  const entries: Dirent[] = await FsPromises.readdir(srcPath, {
    withFileTypes: true,
  });

  const files = await entries.reduce(async (accPromise, dirent: Dirent) => {
    const nextPath: string = path.resolve(srcPath, dirent.name);
    const acc = await accPromise;

    if (ignorePaths) {
      const fullBasePath = `${process.cwd()}/${basePath}`;
      const pathFromSrc = `${nextPath.split(fullBasePath).join(basePath)}${
        dirent.isDirectory() ? '/' : ''
      }`;

      if (
        ignorePaths.some((ignorePath) =>
          pathFromSrc.startsWith(`${ignorePath}/`),
        )
      ) {
        return acc;
      }
    }

    if (dirent.isDirectory()) {
      const generatedNextPath = await generateFilesPaths(nextPath, {
        basePath,
        ignorePaths,
        srcExtensions,
        fileNameResolver,
      });

      acc.push(...generatedNextPath);

      return acc;
    }

    const fileName = path.basename(nextPath);

    if (srcExtensions) {
      const [, ext] = fileName.match(/\.([0-9a-z]+)(?:[?#]|$)/i) || [];
      const validExtension = srcExtensions.some((_ext: string) => {
        if (_ext === ext && fileNameResolver) {
          return useFileNameResolver(fileNameResolver, fileName);
        }

        return _ext === ext;
      });

      if (!validExtension) {
        return acc;
      }
    }

    if (fileNameResolver && !useFileNameResolver(fileNameResolver, fileName)) {
      return acc;
    }

    acc.push(nextPath);

    return acc;
  }, Promise.resolve([]));

  return files;
};
