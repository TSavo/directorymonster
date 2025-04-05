/**
 * Worker Pool Tests
 * 
 * Tests for the authentication worker pool implementation.
 */

import { AuthWorkerPool, getAuthWorkerPool, Task, TaskResult } from '@/lib/auth/worker-pool';
import { Worker } from 'worker_threads';

// Mock the worker_threads module
jest.mock('worker_threads', () => {
  // Create a mock Worker class
  const MockWorker = jest.fn().mockImplementation(() => {
    const eventHandlers: Record<string, Array<(data: any) => void>> = {
      message: [],
      error: [],
      exit: []
    };
    
    return {
      // Mock event listeners
      on: jest.fn().mockImplementation((event: string, handler: (data: any) => void) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(handler);
        return this;
      }),
      
      // Mock event emitters for testing
      emit: (event: string, data: any) => {
        if (eventHandlers[event]) {
          eventHandlers[event].forEach(handler => handler(data));
        }
      },
      
      // Mock postMessage
      postMessage: jest.fn().mockImplementation((task: Task) => {
        // Simulate successful task execution after a short delay
        setTimeout(() => {
          eventHandlers.message.forEach(handler => 
            handler({
              id: task.id,
              success: true,
              result: { verified: true }
            })
          );
        }, 10);
      }),
      
      // Mock terminate
      terminate: jest.fn().mockImplementation(() => {
        setTimeout(() => {
          eventHandlers.exit.forEach(handler => handler(0));
        }, 10);
      }),
      
      // Add threadId for identification
      threadId: Math.floor(Math.random() * 1000)
    };
  });
  
  return {
    Worker: MockWorker
  };
});

// Mock path module
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/'))
}));

// Mock os module
jest.mock('os', () => ({
  cpus: jest.fn().mockReturnValue([{}, {}, {}, {}]) // Mock 4 CPUs
}));

describe('AuthWorkerPool', () => {
  let workerPool: AuthWorkerPool;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Create a new worker pool for each test
    workerPool = new AuthWorkerPool(2); // Use a small pool size for testing
  });
  
  afterEach(async () => {
    // Shut down the worker pool after each test
    await workerPool.shutdown();
  });
  
  describe('initialization', () => {
    it('should create the specified number of workers', () => {
      // Check that the Worker constructor was called the correct number of times
      expect(Worker).toHaveBeenCalledTimes(2);
    });
    
    it('should use the default pool size if none is specified', () => {
      // Reset mock counts
      jest.clearAllMocks();
      
      // Create a worker pool with default size
      const defaultPool = new AuthWorkerPool();
      
      // Default size should be cpus - 1, with min of 2 and max of 4
      // With our mock of 4 CPUs, it should create 3 workers
      expect(Worker).toHaveBeenCalledTimes(3);
      
      // Clean up
      defaultPool.shutdown();
    });
  });
  
  describe('task execution', () => {
    it('should execute tasks and return results', async () => {
      // Create a task
      const task = {
        type: 'verify',
        data: {
          proof: 'test-proof',
          publicSignals: ['test-signal'],
          publicKey: 'test-key'
        }
      };
      
      // Execute the task
      const result = await workerPool.executeTask(task);
      
      // Check that the task was executed successfully
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ verified: true });
    });
    
    it('should handle multiple tasks concurrently', async () => {
      // Create multiple tasks
      const tasks = Array(5).fill(null).map((_, i) => ({
        type: 'verify' as const,
        data: {
          proof: `test-proof-${i}`,
          publicSignals: [`test-signal-${i}`],
          publicKey: `test-key-${i}`
        }
      }));
      
      // Execute all tasks concurrently
      const results = await Promise.all(tasks.map(task => workerPool.executeTask(task)));
      
      // Check that all tasks were executed successfully
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.result).toEqual({ verified: true });
      });
    });
  });
  
  describe('error handling', () => {
    it('should handle worker errors', async () => {
      // Create a worker pool
      const errorPool = new AuthWorkerPool(1);
      
      // Get the worker instance
      const worker = (Worker as jest.Mock).mock.results[2].value;
      
      // Create a task that will be rejected when the worker errors
      const taskPromise = errorPool.executeTask({
        type: 'verify',
        data: { proof: 'error-proof' }
      });
      
      // Simulate a worker error
      worker.emit('error', new Error('Test worker error'));
      
      // The task should be rejected with the error
      await expect(taskPromise).rejects.toThrow('Test worker error');
      
      // Clean up
      await errorPool.shutdown();
    });
    
    it('should replace failed workers', async () => {
      // Reset mock counts
      jest.clearAllMocks();
      
      // Create a worker pool
      const errorPool = new AuthWorkerPool(1);
      
      // Get the worker instance
      const worker = (Worker as jest.Mock).mock.results[0].value;
      
      // Simulate a worker error with exit
      worker.emit('error', new Error('Test worker error'));
      worker.emit('exit', 1);
      
      // A new worker should be created to replace the failed one
      expect(Worker).toHaveBeenCalledTimes(2);
      
      // Clean up
      await errorPool.shutdown();
    });
  });
  
  describe('shutdown', () => {
    it('should terminate all workers on shutdown', async () => {
      // Create a worker pool
      const shutdownPool = new AuthWorkerPool(3);
      
      // Get the worker instances
      const workers = (Worker as jest.Mock).mock.results.slice(2, 5).map(result => result.value);
      
      // Shut down the pool
      await shutdownPool.shutdown();
      
      // All workers should be terminated
      workers.forEach(worker => {
        expect(worker.terminate).toHaveBeenCalled();
      });
    });
  });
  
  describe('singleton', () => {
    it('should return the same instance when getAuthWorkerPool is called multiple times', () => {
      // Reset mock counts
      jest.clearAllMocks();
      
      // Get the worker pool instance twice
      const instance1 = getAuthWorkerPool();
      const instance2 = getAuthWorkerPool();
      
      // Both calls should return the same instance
      expect(instance1).toBe(instance2);
      
      // Worker constructor should only be called once for the singleton
      expect(Worker).toHaveBeenCalledTimes(3); // Default size is 3 with our mock
      
      // Clean up
      instance1.shutdown();
    });
  });
});
