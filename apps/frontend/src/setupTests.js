// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Create shared mock functions
const mockPost = jest.fn()
const mockGet = jest.fn()
const mockPut = jest.fn()
const mockDelete = jest.fn()

// Mock axios to avoid ES module issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  get: mockGet,
  post: mockPost,
  put: mockPut,
  delete: mockDelete,
}))

// Export mock functions for use in tests
global.mockAxios = {
  post: mockPost,
  get: mockGet,
  put: mockPut,
  delete: mockDelete
}
