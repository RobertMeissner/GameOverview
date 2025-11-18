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

module.exports = {
  default: {
    create: jest.fn(() => mockAxiosInstance),
    post: mockPost,
    get: mockGet
  },
  mockPost,
  mockGet,
  mockAxiosInstance
}
