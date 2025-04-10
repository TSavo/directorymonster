# Zero-Knowledge Proof (ZKP) Authentication System

## Overview

The Zero-Knowledge Proof (ZKP) authentication system provides a secure way to authenticate users without revealing their passwords. It uses cryptographic techniques to prove knowledge of a password without actually transmitting the password itself.

## How It Works

1. **Registration**:
   - User provides a username and password
   - System generates a salt
   - Password is hashed with bcrypt
   - Public key is generated from the hashed password
   - Public key is stored in the database

2. **Authentication**:
   - User provides a username and password
   - System retrieves the salt for the username
   - User generates a ZKP proof that they know the password
   - Server verifies the proof against the stored public key
   - If the proof is valid, the user is authenticated

3. **Security Properties**:
   - **Zero-Knowledge**: The server learns nothing about the password
   - **Non-Interactive**: The proof can be verified without interaction
   - **Soundness**: Only someone who knows the password can generate a valid proof
   - **Completeness**: A valid proof will always be accepted

## Implementation Details

### Circuit Implementation

The ZKP circuit is implemented in `circuits/zkp_auth/zkp_auth.circom` and uses the Poseidon hash function for cryptographic operations. The circuit takes the following inputs:

- **Username Hash**: Hash of the username
- **Credentials Hash**: Hash of the password
- **Salt**: Random salt for the password

The circuit verifies that the credentials hash matches the expected hash for the given username and salt.

### Integration with Authentication System

The ZKP authentication system is integrated with the application through the following components:

1. **ZKP Provider**: Manages the ZKP implementation and provides access to the adapter
2. **Snark Adapter**: Handles the cryptographic operations for generating and verifying proofs
3. **ZKP Bcrypt**: Provides a bcrypt-compatible interface for the ZKP system

### Setup and Configuration

To set up the ZKP authentication system:

1. Run the ZKP setup script: `npm run zkp:setup`
2. Configure the ZKP adapter with the correct circuit files
3. Integrate the ZKP authentication system with your application

## Usage

### Generating a Public Key

```typescript
import { generatePublicKey } from '@/lib/zkp/zkp-bcrypt';

const username = 'user123';
const password = 'password123';
const salt = await generateSalt();

const publicKey = await generatePublicKey(username, password, salt);
```

### Generating a ZKP Proof

```typescript
import { generateZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';

const username = 'user123';
const password = 'password123';
const salt = 'stored-salt';

const { proof, publicSignals } = await generateZKPWithBcrypt(username, password, salt);
```

### Verifying a ZKP Proof

```typescript
import { verifyZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';

const isValid = await verifyZKPWithBcrypt(proof, publicSignals, storedPublicKey);
```

### Complete Authentication Flow

```typescript
import { authenticateWithZKP } from '@/lib/auth/zkp-auth-service';

const isAuthenticated = await authenticateWithZKP(username, password);
```

## Testing

The ZKP authentication system has comprehensive tests that verify its functionality and security properties. To run the tests:

1. With mock implementation: `npm run test:zkp`
2. With real implementation: `npm run win:test:zkp:real`

## Security Considerations

1. **Circuit Security**: The ZKP circuit must be carefully designed to prevent leakage of sensitive information
2. **Implementation Security**: The implementation must correctly use the cryptographic primitives
3. **Side-Channel Attacks**: The implementation must be resistant to timing attacks and other side-channel attacks
4. **Key Management**: The public keys must be properly stored and protected

## Future Improvements

1. **Performance Optimization**: Optimize the ZKP circuit for better performance
2. **Enhanced Security**: Add additional security features such as rate limiting and anomaly detection
3. **Integration with Other Systems**: Integrate with other authentication systems such as OAuth and SAML
4. **Mobile Support**: Add support for mobile devices with limited computational resources

## References

1. [Circom Documentation](https://docs.circom.io/)
2. [SnarkJS Documentation](https://github.com/iden3/snarkjs)
3. [Zero-Knowledge Proofs: An Illustrated Primer](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
4. [Poseidon Hash Function](https://www.poseidon-hash.info/)
