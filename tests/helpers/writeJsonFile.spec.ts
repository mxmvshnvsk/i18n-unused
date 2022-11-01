import { jest } from '@jest/globals';
import { writeFileSync } from 'fs';
import {RunOptions} from "../../src/types";
import {writeJsonFile} from "../../src/helpers/writeJsonFile";


jest.mock("fs", () => ({
  writeFileSync: jest.fn()
}));

describe('writeJsonFile', () => {
  describe('defaultValue', () => {
    it('should indent with 2 spaces', async () => {
      const filePath = '/test-file.json';
      const jsonData = {
        test: 'value',
      };
      const config: RunOptions = {
        jsonFileIndentValue: 2,
      }

      writeJsonFile(filePath, jsonData, config);

      const expectedValue = `{\n  "test": "value"\n}\n`;

      expect(writeFileSync).toHaveBeenCalledWith(filePath, expectedValue);
    });
  });

  describe('jsonFileIndentValue of 4', () => {
    it('should indent with 4 spaces', async () => {
      const filePath = '/test-file.json';
      const jsonData = {
        test: 'value',
      };
      const config: RunOptions = {
        jsonFileIndentValue: 4,
      }

      writeJsonFile(filePath, jsonData, config);

      const expectedValue = `{\n    "test": "value"\n}\n`;

      expect(writeFileSync).toHaveBeenCalledWith(filePath, expectedValue);
    });
  });

  describe('jsonFileIndentValue of \t', () => {
    it('should indent with 1 tab', async () => {
      const filePath = '/test-file.json';
      const jsonData = {
        test: 'value',
      };
      const config: RunOptions = {
        jsonFileIndentValue: '\t',
      }

      writeJsonFile(filePath, jsonData, config);

      const expectedValue = `{\n\t"test": "value"\n}\n`;

      expect(writeFileSync).toHaveBeenCalledWith(filePath, expectedValue);
    });
  });


  describe('jsonFileIndentValue of `indent`', () => {
    it('should indent with the string `indent`', async () => {
      const filePath = '/test-file.json';
      const jsonData = {
        test: 'value',
      };
      const config: RunOptions = {
        jsonFileIndentValue: 'indent',
      }

      writeJsonFile(filePath, jsonData, config);

      const expectedValue = `{\nindent"test": "value"\n}\n`;

      expect(writeFileSync).toHaveBeenCalledWith(filePath, expectedValue);
    });
  });
});
