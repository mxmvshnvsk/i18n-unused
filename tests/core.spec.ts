import { applyToFlatKey } from '../src/core/action'
import { createRecursiveStructDefault } from './factories/RecursiveStructFactory'

describe('core-actions', () => {
  describe('applyToFlatKey', () => {
    it('flat objects', () => {
      const result = applyToFlatKey(createRecursiveStructDefault(), 'one', (source, lastKey) => {
        source[lastKey] = 'two';
      }),

      expect(result).toEqual({ one: 'two' })
    })
  })
})
