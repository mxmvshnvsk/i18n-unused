import { isTranslationStructure } from './translations';

type Action = (source: any, key: string, parent?: any, parentKey?: any) => void;

export const applyAction = (source: any, cb: Action, parent?: any, parentKey?: string) => Object
  .keys(source).forEach((key) => {
    if (isTranslationStructure(source[key])) {
      applyAction(source[key], cb, source, key);
    } else {
      cb(source, key, parent, parentKey);
    }
  });
