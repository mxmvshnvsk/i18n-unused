import { ApplyFlat, RecursiveStruct } from '../types';

type Options = {
  flatTranslations: boolean,
  separator: string,
};

export const applyToFlatKey = (
  source: RecursiveStruct,
  key: string,
  cb: ApplyFlat,
  options: Options,
): boolean => {
  const separatedKey = options.flatTranslations ? [key] : key.split(options.separator);
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
