// Mock for zod
module.exports = {
  object: jest.fn(() => ({
    shape: {},
    parse: jest.fn(data => data),
    safeParse: jest.fn(data => ({ success: true, data })),
    extend: jest.fn(() => module.exports.object()),
  })),
  string: jest.fn(() => ({
    min: jest.fn(() => module.exports.string()),
    max: jest.fn(() => module.exports.string()),
    email: jest.fn(() => module.exports.string()),
    optional: jest.fn(() => module.exports.string()),
    nullable: jest.fn(() => module.exports.string()),
  })),
  number: jest.fn(() => ({
    min: jest.fn(() => module.exports.number()),
    max: jest.fn(() => module.exports.number()),
    optional: jest.fn(() => module.exports.number()),
    nullable: jest.fn(() => module.exports.number()),
  })),
  boolean: jest.fn(() => ({
    optional: jest.fn(() => module.exports.boolean()),
    nullable: jest.fn(() => module.exports.boolean()),
  })),
  array: jest.fn(() => ({
    of: jest.fn(() => module.exports.array()),
    optional: jest.fn(() => module.exports.array()),
    nullable: jest.fn(() => module.exports.array()),
  })),
  enum: jest.fn(() => ({})),
  nativeEnum: jest.fn(() => ({})),
};
