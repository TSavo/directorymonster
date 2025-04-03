# Zero-Knowledge Proof Authentication System

This directory contains the Zero-Knowledge Proof (ZKP) authentication system for DirectoryMonster. The system allows users to prove they know their password without revealing it, providing a secure authentication mechanism that protects user credentials even in the event of a server compromise.

## Files

- `zkp_auth.circom`: The circuit definition with multi-round hashing
- `zkp_auth.r1cs`: The R1CS constraint system
- `zkp_auth.sym`: The symbols file for debugging
- `zkp_auth_js/zkp_auth.wasm`: The WebAssembly implementation
- `zkp_auth_final.zkey`: The proving key
- `verification_key.json`: The verification key
- `verifier.sol`: The Solidity verifier contract
- `input.json`: A test input file
- `witness.wtns`: A test witness
- `proof.json`: A test proof
- `public.json`: The public inputs and outputs

## Circuit Design

The ZKP authentication circuit is designed to:

1. Take the username, password, and salt as private inputs
2. Take the salt as a public input
3. Output a public key derived from the inputs

The circuit uses a multi-round hashing approach with the following features:

- 8 rounds of hashing with different prime multipliers
- Domain separation to prevent length extension attacks
- Non-linear mixing in each round
- Final mixing and squaring for additional security

## Security Properties

The ZKP authentication system provides the following security properties:

1. **Zero-Knowledge**: The server learns nothing about the password during authentication
2. **Soundness**: It is computationally infeasible to generate a valid proof without knowing the password
3. **Completeness**: A user who knows the password can always generate a valid proof
4. **Forward Secrecy**: If a password is compromised, previous authentication sessions remain secure
5. **Domain Separation**: The system prevents length extension attacks through domain separation

## Usage

### Client-Side Integration

To use this ZKP authentication system in your application:

1. Import the WebAssembly file and proving key in your JavaScript/TypeScript code
2. Use the `snarkjs` library to generate proofs
3. Send the proof and public signals to the server for verification

Example JavaScript code:

```javascript
const zkp = require('../../src/lib/zkp');

async function authenticate(username, password) {
  // Get the salt from the server
  const response = await fetch(`/api/auth/salt?username=${encodeURIComponent(username)}`);
  const { publicSalt } = await response.json();

  // Generate the proof
  const { proof, publicSignals } = await zkp.generateProof(username, password, publicSalt);

  // Send the proof to the server
  const authResponse = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ proof, publicSignals, username })
  });

  return authResponse.ok;
}
```

### Server-Side Integration

On the server side, you need to:

1. Store the username, salt, and public key (but not the password)
2. Verify proofs during authentication

Example Node.js code:

```javascript
const zkp = require('../../src/lib/zkp');
const crypto = require('crypto');

// Registration endpoint
async function register(req, res) {
  const { username, password } = req.body;

  // Generate a random salt
  const publicSalt = crypto.randomInt(1, 1000000);

  // Generate the public key
  const { publicSignals } = await zkp.generateProof(username, password, publicSalt);
  const publicKey = publicSignals[0];

  // Store the username, salt, and public key (but not the password)
  await db.users.create({
    username,
    publicSalt,
    publicKey
  });

  res.status(201).json({ message: 'User registered successfully' });
}

// Salt endpoint
async function getSalt(req, res) {
  const { username } = req.query;

  // Get the salt for the username
  const user = await db.users.findOne({ username });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ publicSalt: user.publicSalt });
}

// Verification endpoint
async function verify(req, res) {
  const { proof, publicSignals, username } = req.body;

  // Get the user from the database
  const user = await db.users.findOne({ username });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify that the public key matches
  if (publicSignals[0] !== user.publicKey) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify that the salt matches
  if (publicSignals[1] !== user.publicSalt) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify the proof
  const isValid = await zkp.verifyProof(proof, publicSignals);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate a session token
  const token = crypto.randomBytes(32).toString('hex');

  // Store the session token
  await db.sessions.create({
    username,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });

  res.json({ token });
}
```

### Blockchain Integration

You can also use the Solidity verifier to verify proofs on-chain:

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

## Setup and Testing

### Setup

To set up the ZKP authentication system, run:

```bash
npm run zkp:setup
```

This will generate all the necessary files for the ZKP authentication system.

### Docker

To run the ZKP authentication system in Docker, run:

```bash
npm run zkp:docker
```

This will build and run the Docker container for the ZKP authentication system.

### Testing

To run the tests for the ZKP authentication system, run:

```bash
npm run test:crypto:secure
```

This will run the secure ZKP tests, which test proof generation, verification, and security properties.

## Production Deployment

For information on deploying the ZKP authentication system to production, see the [Production Deployment Guide](../../docs/production-deployment.md).
