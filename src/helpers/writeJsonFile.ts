import { writeFileSync } from "fs";
import { RecursiveStruct } from "../types";

interface writeJsonFileOptions {
  jsonFileIndentValue?: string | number;
}

export const writeJsonFile = (
  filePath: string,
  data: RecursiveStruct,
  config: writeJsonFileOptions
): void => {
  const jsonString = JSON.stringify(data, null, config.jsonFileIndentValue);
  const jsonStringWithNewLine = `${jsonString}\n`;
  writeFileSync(filePath, jsonStringWithNewLine);
};
