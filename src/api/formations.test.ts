import { describe, test, expect } from 'bun:test'
import { formationsAPI } from './formations'

describe('formations API', () => {
  test('has required CRUD methods', () => {
    expect(typeof formationsAPI.list).toBe('function')
    expect(typeof formationsAPI.get).toBe('function')
    expect(typeof formationsAPI.create).toBe('function')
    expect(typeof formationsAPI.update).toBe('function')
    expect(typeof formationsAPI.delete).toBe('function')
  })

  test('list method exists and returns a function', () => {
    expect(formationsAPI.list).toBeDefined()
    expect(formationsAPI.list.constructor.name).toBe('AsyncFunction')
  })

  test('create method exists and returns a function', () => {
    expect(formationsAPI.create).toBeDefined()
    expect(formationsAPI.create.constructor.name).toBe('AsyncFunction')
  })

  test('API exports complete interface', () => {
    const methods = Object.keys(formationsAPI)
    expect(methods).toContain('list')
    expect(methods).toContain('get')
    expect(methods).toContain('create')
    expect(methods).toContain('update')
    expect(methods).toContain('delete')
  })
})
