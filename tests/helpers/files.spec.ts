import { resolveFile, generateFilesPaths } from '../../src/helpers/files';
import { jest } from '@jest/globals';
import { pathToFileURL } from 'url';
import { promises } from 'fs';


jest.mock('../../src/helpers/meta', () => ({
  importMetaUrl: () => pathToFileURL(__filename).toString(),
}));

jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn()
  }
}));
jest.mock("process", () => ({
  cwd: jest.fn().mockReturnValue(() => 'Users/JohnSmith/development/project-name')
}));


const loaderMock = jest.fn(() => ({ foo: 'bar' }));



describe('file', () => {
  describe('resolveFile', () => {
    it('should use custom loader', async () => {
      const filePath = '/locales/de/common.yml';
      const result = await resolveFile(filePath, undefined, loaderMock);
      expect(loaderMock).toHaveBeenCalledTimes(1);
      expect(loaderMock).toHaveBeenCalledWith(filePath);
      expect(result).toEqual({ foo: 'bar' });
    });
  });
  
  describe('generateFilesPaths', () => {
    const originalProcess = process

    beforeEach(() => {
      promises.readdir = jest.fn().mockReturnValue([
        { name: 'catFile.jpeg', isDirectory: () => false },
        { name: 'dogFile.png', isDirectory: () => false },
        { name: 'catFile.php', isDirectory: () => false },
        { name: 'Component.vue', isDirectory: () => false },
        { name: 'Welcome.tsx', isDirectory: () => false }
      ]) as any;
    });

    it('handle one level directory paths', async () => {
      const srcPath = '/development/project-name';
      const result = await generateFilesPaths(srcPath, { });

      expect(result).toEqual(["/development/project-name/catFile.jpeg", "/development/project-name/dogFile.png", "/development/project-name/catFile.php", "/development/project-name/Component.vue", "/development/project-name/Welcome.tsx"]);
    });

  });
  
});
