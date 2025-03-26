import { NextResponse } from 'next/server';
import { runMultitenancyTests } from '../../../../tests/multitenant-integration.test';

export async function GET() {
  const results = await runMultitenancyTests();
  
  return NextResponse.json({
    success: results.success,
    stats: {
      passed: results.passed,
      failed: results.failed,
      total: results.passed + results.failed
    },
    message: `Multitenancy tests: ${results.passed} passed, ${results.failed} failed`
  });
}