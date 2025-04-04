// Mock for useTenant hook
export const useTenant = jest.fn().mockReturnValue({
  tenant: null,
  loading: false,
  error: null
});

export default useTenant;
