import { RecursiveStruct } from '../../src/types'

export const createRecursiveStructDefault = (): RecursiveStruct => {
  return {
    one: 'one'
  };
}
export const createRecursiveStructArray = (): RecursiveStruct => {
  return {
    array: ['one', 'two', 'three']
  };
}
export const createRecursiveStructNested = (): RecursiveStruct => {
  return {
    nested: {one: 'one'}
  };
}
