// Mock for react-hook-form
module.exports = {
  useForm: jest.fn(() => ({
    register: jest.fn(),
    handleSubmit: jest.fn(cb => cb),
    formState: {
      errors: {},
      isSubmitting: false,
    },
    reset: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    control: {},
    watch: jest.fn(),
  })),
  Controller: ({ render }) => render({ field: { onChange: jest.fn(), value: '', name: '' } }),
};
