// Mock UI components for testing
jest.mock('../../../../ui/button', () => {
  return {
    __esModule: true,
    Button: jest.requireActual('../mocks/ui/button').Button,
    default: jest.requireActual('../mocks/ui/button').default
  };
});

jest.mock('../../../../ui/input', () => {
  return {
    __esModule: true,
    Input: jest.requireActual('../mocks/ui/input').Input,
    default: jest.requireActual('../mocks/ui/input').default
  };
});

jest.mock('../../../../ui/select', () => {
  return {
    __esModule: true,
    Select: jest.requireActual('../mocks/ui/select').Select,
    default: jest.requireActual('../mocks/ui/select').default
  };
});

jest.mock('../../../../ui/badge', () => {
  return {
    __esModule: true,
    Badge: jest.requireActual('../mocks/ui/badge').Badge,
    default: jest.requireActual('../mocks/ui/badge').default
  };
});

jest.mock('../../../../ui/checkbox', () => {
  return {
    __esModule: true,
    Checkbox: jest.requireActual('../mocks/ui/checkbox').Checkbox,
    default: jest.requireActual('../mocks/ui/checkbox').default
  };
});

jest.mock('../../../../ui/dropdown-menu', () => {
  return {
    __esModule: true,
    DropdownMenu: jest.requireActual('../mocks/ui/dropdown-menu').DropdownMenu,
    DropdownMenuItem: jest.requireActual('../mocks/ui/dropdown-menu').DropdownMenuItem,
    Item: jest.requireActual('../mocks/ui/dropdown-menu').Item,
    default: jest.requireActual('../mocks/ui/dropdown-menu').DropdownMenu
  };
});

// Also mock @/ui paths
jest.mock('@/ui/button', () => {
  return {
    __esModule: true,
    Button: jest.requireActual('../mocks/ui/button').Button,
    default: jest.requireActual('../mocks/ui/button').default
  };
});

jest.mock('@/ui/input', () => {
  return {
    __esModule: true,
    Input: jest.requireActual('../mocks/ui/input').Input,
    default: jest.requireActual('../mocks/ui/input').default
  };
});

jest.mock('@/ui/select', () => {
  return {
    __esModule: true,
    Select: jest.requireActual('../mocks/ui/select').Select,
    default: jest.requireActual('../mocks/ui/select').default
  };
});

jest.mock('@/ui/badge', () => {
  return {
    __esModule: true,
    Badge: jest.requireActual('../mocks/ui/badge').Badge,
    default: jest.requireActual('../mocks/ui/badge').default
  };
});

jest.mock('@/ui/checkbox', () => {
  return {
    __esModule: true,
    Checkbox: jest.requireActual('../mocks/ui/checkbox').Checkbox,
    default: jest.requireActual('../mocks/ui/checkbox').default
  };
});

jest.mock('@/ui/dropdown-menu', () => {
  return {
    __esModule: true,
    DropdownMenu: jest.requireActual('../mocks/ui/dropdown-menu').DropdownMenu,
    DropdownMenuItem: jest.requireActual('../mocks/ui/dropdown-menu').DropdownMenuItem,
    Item: jest.requireActual('../mocks/ui/dropdown-menu').Item,
    default: jest.requireActual('../mocks/ui/dropdown-menu').DropdownMenu
  };
});