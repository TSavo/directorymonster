# TypeScript Type Definitions

## Overview

This document describes the improvements made to fix reserved keyword issues in the TypeScript type definitions for the snarkjs library.

## Previous Implementation

The previous implementation used a reserved keyword (`new`) as a function name in the TypeScript type definitions, which caused compilation errors and potential issues with IDE tooling.

```typescript
// src/types/snarkjs.d.ts
export namespace powersOfTau {
  export function new(
    curve: string,
    power: number,
    outputFile: string,
    verbose: boolean
  ): Promise<void>;
  
  // ...
}
```

## Improved Implementation

The improved implementation renames the function to `createPowersOfTau`, which is not a reserved keyword and better describes the function's purpose.

```typescript
// src/types/snarkjs.d.ts
export namespace powersOfTau {
  export function createPowersOfTau(
    curve: string,
    power: number,
    outputFile: string,
    verbose: boolean
  ): Promise<void>;
  
  // ...
}
```

## Security Benefits

1. **Compilation Safety**: Prevents TypeScript compilation errors that could lead to runtime issues.
2. **Code Reliability**: Ensures that the type definitions accurately represent the library's API.
3. **Developer Experience**: Improves IDE tooling support and code completion.
4. **Maintainability**: Makes the code more maintainable by following TypeScript best practices.

## Testing

The implementation is tested in:

- `tests/types/snarkjs.test.ts`

Run the tests with:

```bash
npx jest tests/types/snarkjs.test.ts
```

## CI/CD Integration

This security improvement is verified in the CI/CD pipeline through:

- The `security-checks.yml` workflow
- The `zkp-auth.yml` workflow with added security checks

## Best Practices

1. Avoid using reserved keywords as identifiers in TypeScript code.
2. Use descriptive names for functions and variables that indicate their purpose.
3. Follow TypeScript naming conventions (camelCase for functions, PascalCase for types).
4. Keep type definitions in sync with the actual implementation.
