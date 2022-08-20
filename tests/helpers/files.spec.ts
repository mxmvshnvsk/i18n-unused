import { resolveFile } from '../../src/helpers/files';
import { jest } from '@jest/globals';
import { pathToFileURL } from 'url';

jest.mock('../../src/helpers/meta', () => ({
  importMetaUrl: () => pathToFileURL(__filename).toString(),
}));

const loaderMock = jest.fn(() => ({ foo: 'bar' }));

describe('resolveFile', () => {
  it('should use custom loader', async () => {
    const filePath = '/locales/de/common.yml';
    const result = await resolveFile(filePath, undefined, loaderMock);
    expect(loaderMock).toHaveBeenCalledTimes(1);
    expect(loaderMock).toHaveBeenCalledWith(filePath);
    expect(result).toEqual({ foo: 'bar' });
  });
});
