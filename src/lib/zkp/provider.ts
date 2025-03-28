import { ZKPAdapter, ZKPProvider } from './adapter';
import { SnarkAdapter } from './snark-adapter';

/**
 * SnarkJS Provider Implementation
 * 
 * This provider uses SnarkJS for Zero-Knowledge Proofs.
 */
export class SnarkProvider implements ZKPProvider {
  private static instance: SnarkProvider;
  private adapter: ZKPAdapter;
  
  private constructor() {
    this.adapter = new SnarkAdapter();
  }
  
  /**
   * Get the singleton instance of SnarkProvider
   * @returns The SnarkProvider instance
   */
  public static getInstance(): SnarkProvider {
    if (!SnarkProvider.instance) {
      SnarkProvider.instance = new SnarkProvider();
    }
    return SnarkProvider.instance;
  }
  
  /**
   * Get the ZKP adapter implementation
   * @returns The ZKP adapter
   */
  public getAdapter(): ZKPAdapter {
    return this.adapter;
  }
}

/**
 * Factory function to get the current ZKP provider
 * @returns The current ZKP provider
 */
export function getZKPProvider(): ZKPProvider {
  return SnarkProvider.getInstance();
}
