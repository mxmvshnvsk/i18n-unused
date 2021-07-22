import { ApplyFlat, RecursiveStruct } from '../types';

export const applyToFlatKey = (
  source: RecursiveStruct,
  key: string,
  cb: ApplyFlat,
  separator = '.',
): boolean => {
  const separatedKey = key.split(separator);
  const keyLength = separatedKey.length - 1;

  separatedKey.reduce((acc, _k, i) => {
    if (i === keyLength) {
      cb(acc, _k);
    } else {
      acc = acc[_k] as RecursiveStruct;
    }

    return acc;
  }, source);

  return true;
};
