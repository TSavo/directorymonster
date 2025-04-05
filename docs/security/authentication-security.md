# Authentication Security Components

This document provides a comprehensive overview of the security components implemented in the authentication system.

## Table of Contents

1. [Overview](#overview)
2. [Security Components](#security-components)
   - [Worker Pool](#worker-pool)
   - [Concurrency Management](#concurrency-management)
   - [Rate Limiting](#rate-limiting)
   - [Progressive Delay](#progressive-delay)
   - [IP Blocking](#ip-blocking)
   - [CAPTCHA Integration](#captcha-integration)
3. [Security Measures](#security-measures)
   - [Brute Force Protection](#brute-force-protection)
   - [Distributed Denial of Service (DDoS) Protection](#distributed-denial-of-service-ddos-protection)
   - [Resource Exhaustion Protection](#resource-exhaustion-protection)
4. [Configuration](#configuration)
5. [Monitoring and Auditing](#monitoring-and-auditing)
6. [Testing](#testing)

## Overview

The authentication system implements multiple layers of security to protect against various types of attacks, including brute force attacks, distributed denial of service (DDoS) attacks, and resource exhaustion attacks. The system uses a combination of worker pools, concurrency management, rate limiting, progressive delay, IP blocking, and CAPTCHA integration to provide comprehensive security.

## Security Components

### Worker Pool

The worker pool is a key component of the authentication system that provides the following security benefits:

- **Isolation**: Each authentication request is processed in a separate worker thread, isolating it from other requests and preventing a single malicious request from affecting the entire system.
- **Resource Management**: The worker pool limits the number of concurrent authentication requests, preventing resource exhaustion attacks.
- **Fault Tolerance**: If a worker thread crashes, the worker pool automatically creates a new worker to replace it, ensuring that the system remains available.

#### Implementation

The worker pool is implemented in `src/lib/auth/worker-pool.ts` and uses the Node.js `worker_threads` module to create and manage worker threads. The worker pool provides the following features:

- **Dynamic Sizing**: The worker pool automatically adjusts its size based on the number of CPU cores available, ensuring optimal performance.
- **Task Queue**: If all workers are busy, new tasks are queued until a worker becomes available.
- **Error Handling**: If a worker encounters an error, the worker pool automatically creates a new worker to replace it.
- **Graceful Shutdown**: The worker pool provides a method to gracefully shut down all workers when the application is terminated.

### Concurrency Management

Concurrency management is a critical component of the authentication system that prevents resource exhaustion attacks by limiting the number of concurrent authentication requests. It provides the following security benefits:

- **Global Concurrency Limits**: The system limits the total number of concurrent authentication requests across all users.
- **Per-User Concurrency Limits**: The system limits the number of concurrent authentication requests for each user.
- **Distributed Locking**: The system uses Redis to implement distributed locks, ensuring that concurrency limits are enforced across multiple instances of the application.

#### Implementation

Concurrency management is implemented in `src/lib/auth/concurrency.ts` and uses Redis to track and limit concurrent requests. The concurrency management system provides the following features:

- **Atomic Operations**: All concurrency operations are atomic, ensuring that concurrency limits are enforced correctly.
- **Distributed State**: The system uses Redis to store concurrency state, ensuring that concurrency limits are enforced across multiple instances of the application.
- **Automatic Cleanup**: The system automatically cleans up concurrency state after a request is completed, ensuring that resources are not leaked.

### Rate Limiting

Rate limiting is a fundamental security measure that prevents brute force attacks by limiting the number of authentication attempts within a specific time window. It provides the following security benefits:

- **Request Rate Limiting**: The system limits the number of authentication requests per IP address within a specific time window.
- **Configurable Limits**: The rate limits are configurable based on the risk level of the IP address.
- **Distributed State**: The system uses Redis to store rate limiting state, ensuring that rate limits are enforced across multiple instances of the application.

#### Implementation

Rate limiting is implemented in `src/app/api/auth/verify/route.ts` using the `next-rate-limit` middleware. The rate limiting system provides the following features:

- **IP-Based Rate Limiting**: The system limits the number of authentication requests per IP address.
- **Configurable Time Windows**: The time window for rate limiting is configurable.
- **Custom Response**: The system provides a custom response when rate limits are exceeded, including information about when the rate limit will reset.

### Progressive Delay

Progressive delay is an advanced security measure that adds increasing delays to authentication attempts after failed attempts. It provides the following security benefits:

- **Exponential Backoff**: The delay increases exponentially with each failed attempt, making brute force attacks increasingly time-consuming.
- **Jitter**: Random jitter is added to the delay to prevent attackers from predicting the exact delay.
- **IP-Based Tracking**: The system tracks failed attempts per IP address, ensuring that delays are applied consistently.

#### Implementation

Progressive delay is implemented in `src/lib/auth/progressive-delay.ts` and uses Redis to track failed attempts and calculate delays. The progressive delay system provides the following features:

- **Exponential Backoff**: The delay increases exponentially with each failed attempt, starting from 1 second and doubling with each attempt.
- **Maximum Delay**: The delay is capped at a maximum value to prevent excessive delays for legitimate users.
- **Jitter**: Random jitter of ±10% is added to the delay to prevent attackers from predicting the exact delay.
- **Automatic Reset**: The delay is automatically reset after a successful authentication.

### IP Blocking

IP blocking is a powerful security measure that blocks IP addresses that exhibit suspicious behavior. It provides the following security benefits:

- **Temporary Blocking**: IP addresses are temporarily blocked after exceeding a configurable number of failed authentication attempts.
- **Risk-Based Thresholds**: The threshold for blocking is based on the risk level of the IP address.
- **Configurable Block Duration**: The duration of the block is configurable based on the risk level of the IP address.

#### Implementation

IP blocking is implemented in `src/lib/auth/ip-blocker.ts` and uses Redis to track failed attempts and block IP addresses. The IP blocking system provides the following features:

- **Risk-Based Thresholds**: The threshold for blocking is based on the risk level of the IP address, with lower thresholds for high-risk IP addresses.
- **Configurable Block Duration**: The duration of the block is configurable based on the risk level of the IP address, with longer durations for high-risk IP addresses.
- **Automatic Unblocking**: IP addresses are automatically unblocked after the block duration expires.
- **Audit Logging**: All blocking events are logged for audit purposes.

### CAPTCHA Integration

CAPTCHA integration is a user-friendly security measure that prevents automated attacks by requiring human verification. It provides the following security benefits:

- **Human Verification**: CAPTCHA requires human interaction, preventing automated attacks.
- **Progressive Application**: CAPTCHA is only required after a configurable number of failed authentication attempts.
- **Risk-Based Thresholds**: The threshold for requiring CAPTCHA is based on the risk level of the IP address.

#### Implementation

CAPTCHA integration is implemented in `src/lib/auth/captcha-service.ts` for the server-side and `src/components/admin/auth/CaptchaWidget.tsx` for the client-side. The CAPTCHA integration provides the following features:

- **reCAPTCHA Support**: The system supports Google reCAPTCHA for CAPTCHA verification.
- **Custom CAPTCHA Fallback**: If reCAPTCHA is not available, the system falls back to a custom CAPTCHA implementation.
- **Risk-Based Thresholds**: The threshold for requiring CAPTCHA is based on the risk level of the IP address, with lower thresholds for high-risk IP addresses.
- **Automatic Reset**: The CAPTCHA requirement is automatically reset after a successful authentication.

## Security Measures

### Brute Force Protection

The authentication system implements multiple layers of protection against brute force attacks:

1. **Rate Limiting**: Limits the number of authentication attempts per IP address within a specific time window.
2. **Progressive Delay**: Adds increasing delays to authentication attempts after failed attempts.
3. **IP Blocking**: Blocks IP addresses that exceed a configurable number of failed authentication attempts.
4. **CAPTCHA Integration**: Requires human verification after a configurable number of failed authentication attempts.

These measures work together to make brute force attacks impractical by significantly increasing the time and resources required to perform such attacks.

### Distributed Denial of Service (DDoS) Protection

The authentication system implements multiple layers of protection against DDoS attacks:

1. **Worker Pool**: Limits the number of concurrent authentication requests, preventing resource exhaustion.
2. **Concurrency Management**: Limits the number of concurrent authentication requests per user and globally.
3. **Rate Limiting**: Limits the number of authentication attempts per IP address within a specific time window.
4. **IP Blocking**: Blocks IP addresses that exhibit suspicious behavior.

These measures work together to protect the system from DDoS attacks by limiting the resources that can be consumed by a single IP address or user.

### Resource Exhaustion Protection

The authentication system implements multiple layers of protection against resource exhaustion attacks:

1. **Worker Pool**: Limits the number of concurrent authentication requests, preventing resource exhaustion.
2. **Concurrency Management**: Limits the number of concurrent authentication requests per user and globally.
3. **Task Queue**: Queues authentication requests when all workers are busy, preventing resource exhaustion.
4. **Timeouts**: Implements timeouts for authentication requests, preventing long-running requests from consuming resources.

These measures work together to protect the system from resource exhaustion attacks by limiting the resources that can be consumed by authentication requests.

## Configuration

The authentication security components are highly configurable to adapt to different security requirements. The following configuration options are available:

### Worker Pool Configuration

- **Pool Size**: The number of worker threads in the pool. Defaults to the number of CPU cores minus 1, with a minimum of 2 and a maximum of 4.
- **Task Queue Size**: The maximum number of tasks that can be queued. Defaults to 100.

### Concurrency Management Configuration

- **Global Concurrency Limit**: The maximum number of concurrent authentication requests across all users. Defaults to 100.
- **Per-User Concurrency Limit**: The maximum number of concurrent authentication requests per user. Defaults to 5.
- **Lock Timeout**: The timeout for distributed locks. Defaults to 10 seconds.

### Rate Limiting Configuration

- **Request Limit**: The maximum number of authentication requests per IP address within the time window. Defaults to 10.
- **Time Window**: The time window for rate limiting. Defaults to 60 seconds.

### Progressive Delay Configuration

- **Base Delay**: The initial delay after the first failed attempt. Defaults to 1 second.
- **Maximum Delay**: The maximum delay that can be applied. Defaults to 60 seconds.
- **Jitter Percentage**: The percentage of jitter to add to the delay. Defaults to 10%.

### IP Blocking Configuration

- **Low Risk Threshold**: The number of failed attempts before blocking a low-risk IP address. Defaults to 15.
- **Medium Risk Threshold**: The number of failed attempts before blocking a medium-risk IP address. Defaults to 8.
- **High Risk Threshold**: The number of failed attempts before blocking a high-risk IP address. Defaults to 5.
- **Low Risk Block Duration**: The duration to block a low-risk IP address. Defaults to 12 hours.
- **Medium Risk Block Duration**: The duration to block a medium-risk IP address. Defaults to 24 hours.
- **High Risk Block Duration**: The duration to block a high-risk IP address. Defaults to 48 hours.

### CAPTCHA Configuration

- **Low Risk Threshold**: The number of failed attempts before requiring CAPTCHA for a low-risk IP address. Defaults to 5.
- **Medium Risk Threshold**: The number of failed attempts before requiring CAPTCHA for a medium-risk IP address. Defaults to 2.
- **High Risk Threshold**: The number of failed attempts before requiring CAPTCHA for a high-risk IP address. Defaults to 1.
- **reCAPTCHA Site Key**: The site key for Google reCAPTCHA. Defaults to the value of the `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` environment variable.
- **reCAPTCHA Secret Key**: The secret key for Google reCAPTCHA. Defaults to the value of the `RECAPTCHA_SECRET_KEY` environment variable.

## Monitoring and Auditing

The authentication system includes comprehensive monitoring and auditing capabilities to detect and respond to security incidents:

### Audit Logging

All security-related events are logged using the `AuditService` in `src/lib/audit/audit-service.ts`. The following events are logged:

- **Login Success**: Successful authentication attempts.
- **Login Failure**: Failed authentication attempts.
- **Rate Limit Exceeded**: Rate limit exceeded events.
- **IP Blocked**: IP blocking events.
- **CAPTCHA Required**: CAPTCHA requirement events.
- **CAPTCHA Verified**: CAPTCHA verification events.
- **System Error**: System errors during authentication.

### Monitoring

The authentication system provides the following monitoring capabilities:

- **Failed Attempt Tracking**: The system tracks failed authentication attempts per IP address and user.
- **IP Risk Level Tracking**: The system tracks the risk level of IP addresses.
- **Concurrency Tracking**: The system tracks the number of concurrent authentication requests per user and globally.
- **Worker Pool Metrics**: The system tracks the number of active workers, queued tasks, and completed tasks.

## Testing

The authentication security components are thoroughly tested to ensure their effectiveness:

### Unit Tests

Unit tests are implemented for each security component to verify its functionality in isolation:

- **Worker Pool Tests**: Tests for worker creation, task execution, error handling, and worker recovery.
- **Concurrency Management Tests**: Tests for distributed lock acquisition and release, request tracking, and concurrent request limits.
- **Rate Limiting Tests**: Tests for request rate limiting and custom responses.
- **Progressive Delay Tests**: Tests for exponential backoff with jitter, delay calculation, and automatic reset.
- **IP Blocking Tests**: Tests for risk-based thresholds, block duration, and automatic unblocking.
- **CAPTCHA Integration Tests**: Tests for CAPTCHA requirement, verification, and automatic reset.

### Integration Tests

Integration tests are implemented to verify the interaction between security components:

- **Authentication Flow Tests**: Tests for the complete authentication flow with all security measures.
- **Edge Case Tests**: Tests for edge cases such as missing parameters, user not found, worker pool errors, and Redis errors.
- **Concurrency Tests**: Tests for concurrent authentication requests.

### Browser Tests

Browser tests are implemented for client-side components:

- **CAPTCHA Widget Tests**: Tests for the CAPTCHA widget component, including reCAPTCHA and custom CAPTCHA modes.
- **Accessibility Tests**: Tests for accessibility features of the CAPTCHA widget.

All tests are implemented using Jest and can be run using the `npm test` command.
