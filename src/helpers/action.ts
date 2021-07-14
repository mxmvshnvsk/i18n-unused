import { ApplyFlat } from '../types';

export const applyToFlatKey = (source: any, key: string, cb: ApplyFlat, separator: string = '.') => {
  const separatedKey = key.split(separator);
  const keyLength = separatedKey.length - 1;

  separatedKey.reduce((acc, _k, i) => {
    if (i === keyLength) {
      cb(acc, _k);
    } else {
      acc = acc[_k];
    }

    return acc;
  }, source);
};
