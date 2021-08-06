import { applyToFlatKey } from '../../src/core/action'
import {
  createRecursiveStructArray,
  createRecursiveStructDefault, createRecursiveStructNested,
} from '../factories/RecursiveStructFactory'

describe('core-actions', () => {
  describe('applyToFlatKey', () => {
    it('flat', () => {
      const struct = createRecursiveStructDefault()
      applyToFlatKey(struct, 'one', (source, lastKey) => {
        source[lastKey] = 'NEW'
      })
      expect(struct).toEqual({ one: 'NEW' })
    })
    it('array', () => {
      const struct = createRecursiveStructArray()
      applyToFlatKey(struct, 'array.0', (source, lastKey) => {
        source[lastKey] = 'NEW'
      })
      expect(struct).toEqual({ array: ['NEW', 'two', 'three'] })
    })
    it('nested', () => {
      const struct = createRecursiveStructNested()
      applyToFlatKey(struct, 'nested.one', (source, lastKey) => {
        source[lastKey] = 'NEW'
      })
      expect(struct).toEqual({ nested: {one: 'NEW'} })
    })
  })
})
