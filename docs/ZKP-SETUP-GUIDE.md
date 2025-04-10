# Zero-Knowledge Proof (ZKP) Authentication System Setup Guide

This guide provides step-by-step instructions for setting up the ZKP authentication system from scratch in a fresh deployment.

## Prerequisites

Before you begin, make sure you have the following installed:

- Node.js (v14 or later)
- npm (v6 or later)
- TypeScript

## Step 1: Clone the Repository

If you haven't already, clone the repository and navigate to the project directory:

```bash
git clone <repository-url>
cd <repository-directory>
```

## Step 2: Install Dependencies

Install the project dependencies:

```bash
npm install
```

## Step 3: Set Up the ZKP Authentication System

The ZKP authentication system requires several files to be generated, including circuit files, proving keys, and verification keys. We've provided a script to automate this process.

### For Windows Users:

```bash
npm run win:zkp:setup
```

### For Unix/Linux/Mac Users:

```bash
npm run zkp:setup
```

This script will:

1. Create necessary directories
2. Generate Powers of Tau file if needed
3. Compile the simple auth circuit
4. Move WebAssembly files to the correct location
5. Generate the proving key
6. Export the verification key
7. Generate a Solidity verifier
8. Create test input files
9. Generate a witness
10. Generate and verify a proof

The script will output the locations of all generated files.

## Step 4: Verify the Setup

After running the setup script, you should have the following directory structure:

```
circuits/
├── ptau/
│   └── pot12_final.ptau
└── zkp_auth/
    ├── simple_auth.circom
    ├── poseidon_envelope.circom
    ├── poseidon_no_pragma.circom
    ├── poseidon_constants_no_pragma.circom
    └── simple_auth_output/
        ├── simple_auth.r1cs
        ├── simple_auth.sym
        ├── simple_auth_js/
        │   └── simple_auth.wasm
        ├── simple_auth_final.zkey
        ├── verification_key.json
        ├── verifier.sol
        ├── input.json
        ├── witness.wtns
        ├── proof.json
        ├── public.json
        └── README.md
```

## Step 5: Configure the ZKP Adapter

The ZKP adapter needs to be configured to use the correct circuit files. This is already done in the codebase, but you can verify the configuration in `src/lib/zkp/snark-adapter.ts`:

```typescript
// Set paths to circuit files
this.wasmFilePath = 'circuits/zkp_auth/simple_auth_output/simple_auth_js/simple_auth.wasm';
this.zkeyFilePath = 'circuits/zkp_auth/simple_auth_output/simple_auth_final.zkey';
this.verificationKeyPath = 'circuits/zkp_auth/simple_auth_output/verification_key.json';
```

## Step 6: Test the ZKP Authentication System

Now that the ZKP authentication system is set up, you can test it to make sure everything is working correctly.

### Run Tests with Mock Implementation:

```bash
npm run test:zkp
```

### Run Tests with Real Implementation:

#### For Windows Users:

```bash
npm run win:test:zkp:real
```

#### For Unix/Linux/Mac Users:

```bash
npm run test:zkp:real
```

## Step 7: Integrate with Your Application

To use the ZKP authentication system in your application:

1. Import the ZKP provider:

```typescript
import { getZKPProvider } from '@/lib/zkp';
```

2. Use the provider to generate and verify proofs:

```typescript
const provider = getZKPProvider();
const adapter = provider.getAdapter();

// Generate a proof
const proof = await adapter.generateProof({
  username: 'user123',
  password: 'password123',
  salt: 'random-salt'
});

// Verify a proof
const isValid = await adapter.verifyProof({
  proof: proof.proof,
  publicSignals: proof.publicSignals,
  publicKey: 'stored-public-key'
});
```

3. Use the ZKP authentication service:

```typescript
import { authenticateWithZKP } from '@/lib/auth/zkp-auth-service';

const isAuthenticated = await authenticateWithZKP(username, password);
```

## Troubleshooting

If you encounter any issues during the setup process, here are some common problems and solutions:

### Missing Dependencies

If you get errors about missing dependencies, try installing them manually:

```bash
npm install snarkjs circomlib ts-node
```

### Circuit Compilation Errors

If the circuit fails to compile, make sure all the required circuit files exist:

- `circuits/zkp_auth/simple_auth.circom`
- `circuits/zkp_auth/poseidon_envelope.circom`
- `circuits/zkp_auth/poseidon_no_pragma.circom`
- `circuits/zkp_auth/poseidon_constants_no_pragma.circom`

### Test Failures

If the tests fail, try running them with the mock implementation first:

```bash
npm run test:zkp
```

Then try running them with the real implementation:

```bash
npm run win:test:zkp:real
```

If the tests still fail, check the error messages for clues about what might be wrong.

## Additional Resources

For more information about the ZKP authentication system, see:

- [ZKP Authentication System Documentation](./ZKP-AUTHENTICATION-SYSTEM.md)
- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS Documentation](https://github.com/iden3/snarkjs)

## Conclusion

You have now set up the ZKP authentication system from scratch in a fresh deployment. The system is ready to use in your application.

For any questions or issues, please contact the development team.
