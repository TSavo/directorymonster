# ZKP Authentication System

This directory contains the ZKP authentication system files generated on 2025-04-04T02:25:46.367Z.

## Files

- `zkp_auth.circom`: The circuit definition
- `zkp_auth.r1cs`: The R1CS constraints
- `zkp_auth.sym`: The symbols file
- `zkp_auth_js/zkp_auth.wasm`: The WebAssembly file
- `zkp_auth_final.zkey`: The proving key
- `verification_key.json`: The verification key
- `verifier.sol`: The Solidity verifier
- `input.json`: A test input file
- `witness.wtns`: A test witness
- `proof.json`: A test proof
- `public.json`: The public inputs and outputs

## Usage

To use this ZKP authentication system in your application:

1. Import the WebAssembly file and proving key in your JavaScript/TypeScript code
2. Use the `snarkjs` library to generate proofs
3. Use the Solidity verifier to verify proofs on-chain

Example JavaScript code:

```javascript
const snarkjs = require('snarkjs');
const fs = require('fs');

async function generateProof(username, password, publicSalt) {
  const input = {
    username,
    password,
    publicSalt
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    'path/to/zkp_auth.wasm',
    'path/to/zkp_auth_final.zkey'
  );

  return { proof, publicSignals };
}

async function verifyProof(proof, publicSignals) {
  const vkey = JSON.parse(fs.readFileSync('path/to/verification_key.json'));
  return await snarkjs.groth16.verify(vkey, publicSignals, proof);
}
```

Example Solidity code:

```solidity
// Import the verifier contract
import "./verifier.sol";

contract ZKPAuth {
    Verifier public verifier;

    constructor(address _verifier) {
        verifier = Verifier(_verifier);
    }

    function authenticate(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) public view returns (bool) {
        return verifier.verifyProof(a, b, c, input);
    }
}
```

## Regenerating the Files

To regenerate these files, run:

```bash
npm run zkp:setup
```
