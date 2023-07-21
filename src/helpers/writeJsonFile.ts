import { writeFileSync } from 'fs';
import { RecursiveStruct } from '../types';

interface writeJsonFileOptions {
  localeJsonStringifyIndent?: string | number;
}

export const writeJsonFile = (
  filePath: string,
  data: RecursiveStruct,
  config: writeJsonFileOptions,
): void => {
  const jsonString = JSON.stringify(
    data,
    null,
    config.localeJsonStringifyIndent,
  );
  const jsonStringWithNewLine = `${jsonString}\n`;
  writeFileSync(filePath, jsonStringWithNewLine);
};
