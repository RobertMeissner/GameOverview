const mockPost = jest.fn()
const mockGet = jest.fn()

const mockAxiosInstance = {
  post: mockPost,
  get: mockGet,
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}

export default {
  create: jest.fn(() => mockAxiosInstance),
  post: mockPost,
  get: mockGet
}

export { mockPost, mockGet, mockAxiosInstance }
