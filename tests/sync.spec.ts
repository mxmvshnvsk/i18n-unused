import { mergeLocaleData } from '../src/actions/sync'

describe('actions-sync', () => {
  describe('mergeLocaleData', () => {
    test('flat objects', () => {
      expect(mergeLocaleData({one: 'one'}, {two: 'two'}))
        .toEqual({one: 'one', two: 'two'})
    })
    test('flat objects', () => {
      expect(mergeLocaleData({one: 'one'}, {one: 'one-overriden'}))
        .toEqual({one: 'one-overriden'})
    })
    test('nested objects', () => {
      expect(mergeLocaleData({one: 'one'}, {two: {three: 'three'}}))
        .toEqual({one: 'one', two: {three: 'three'}})
    })
  })
})
