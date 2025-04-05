/**
 * Worker Pool for Authentication Requests
 *
 * This module provides a worker pool implementation for handling
 * concurrent authentication requests efficiently.
 */

import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';

// Configuration
const DEFAULT_POOL_SIZE = Math.max(2, Math.min(4, os.cpus().length - 1));
const MAX_QUEUE_SIZE = 100;

// Task types
export interface Task {
  id: string;
  type: 'verify' | 'generate';
  data: any;
}

export interface TaskResult {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Worker Pool for handling authentication requests
 */
export class AuthWorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{
    task: Task;
    resolve: (value: TaskResult) => void;
    reject: (reason: any) => void;
  }> = [];
  private workerMap = new Map<Worker, string>();
  private isShuttingDown = false;

  /**
   * Create a new worker pool
   * @param size The number of workers in the pool
   */
  constructor(private size = DEFAULT_POOL_SIZE) {
    this.initialize();
  }

  /**
   * Initialize the worker pool
   */
  private initialize(): void {
    console.log(`Initializing auth worker pool with ${this.size} workers`);

    for (let i = 0; i < this.size; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker
   */
  private createWorker(): void {
    try {
      const worker = new Worker(path.join(process.cwd(), 'src/lib/auth/auth-worker.js'));

      worker.on('message', (result: TaskResult) => {
        this.handleWorkerMessage(worker, result);
      });

      worker.on('error', (error) => {
        this.handleWorkerError(worker, error);
      });

      worker.on('exit', (code) => {
        this.handleWorkerExit(worker, code);
      });

      this.workers.push(worker);
      this.availableWorkers.push(worker);

      // Only log in non-test environments to avoid test output issues
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Worker ${worker.threadId} created`);
      }
    } catch (error) {
      // Only log in non-test environments to avoid test output issues
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error creating worker:', error);
      }
    }
  }

  /**
   * Handle a message from a worker
   * @param worker The worker that sent the message
   * @param result The result from the worker
   */
  private handleWorkerMessage(worker: Worker, result: TaskResult): void {
    // Mark the worker as available
    this.availableWorkers.push(worker);

    // Clear the worker's task ID
    this.workerMap.delete(worker);

    // Find the task in the queue
    const taskIndex = this.taskQueue.findIndex(item => item.task.id === result.id);

    if (taskIndex !== -1) {
      const { resolve } = this.taskQueue[taskIndex];
      this.taskQueue.splice(taskIndex, 1);
      resolve(result);
    }

    // Process the next task if available
    this.processNextTask();
  }

  /**
   * Handle an error from a worker
   * @param worker The worker that had an error
   * @param error The error
   */
  private handleWorkerError(worker: Worker, error: Error): void {
    console.error(`Worker ${worker.threadId} error:`, error);

    // Get the task ID for this worker
    const taskId = this.workerMap.get(worker);

    if (taskId) {
      // Find the task in the queue
      const taskIndex = this.taskQueue.findIndex(item => item.task.id === taskId);

      if (taskIndex !== -1) {
        const { reject } = this.taskQueue[taskIndex];
        this.taskQueue.splice(taskIndex, 1);
        reject(error);
      }

      // Clear the worker's task ID
      this.workerMap.delete(worker);
    }

    // Remove the worker from the available workers
    const index = this.availableWorkers.indexOf(worker);
    if (index !== -1) {
      this.availableWorkers.splice(index, 1);
    }

    // Remove the worker from the workers list
    const workerIndex = this.workers.indexOf(worker);
    if (workerIndex !== -1) {
      this.workers.splice(workerIndex, 1);
    }

    // Create a new worker to replace the failed one
    if (!this.isShuttingDown) {
      this.createWorker();
    }
  }

  /**
   * Handle a worker exit
   * @param worker The worker that exited
   * @param code The exit code
   */
  private handleWorkerExit(worker: Worker, code: number): void {
    console.log(`Worker ${worker.threadId} exited with code ${code}`);

    // Remove the worker from the available workers
    const index = this.availableWorkers.indexOf(worker);
    if (index !== -1) {
      this.availableWorkers.splice(index, 1);
    }

    // Remove the worker from the workers list
    const workerIndex = this.workers.indexOf(worker);
    if (workerIndex !== -1) {
      this.workers.splice(workerIndex, 1);
    }

    // Create a new worker to replace the exited one
    if (!this.isShuttingDown && code !== 0) {
      this.createWorker();
    }
  }

  /**
   * Process the next task in the queue
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const worker = this.availableWorkers.shift()!;
    const { task } = this.taskQueue[0];

    // Store the task ID for this worker
    this.workerMap.set(worker, task.id);

    // Send the task to the worker
    worker.postMessage(task);
  }

  /**
   * Execute a task in the worker pool
   * @param task The task to execute
   * @returns A promise that resolves with the task result
   */
  public async executeTask(task: Omit<Task, 'id'>): Promise<TaskResult> {
    // Generate a unique ID for the task
    const id = Math.random().toString(36).substring(2, 15);
    const fullTask: Task = { ...task, id };

    // Check if the queue is full
    if (this.taskQueue.length >= MAX_QUEUE_SIZE) {
      throw new Error('Authentication worker pool queue is full');
    }

    return new Promise<TaskResult>((resolve, reject) => {
      // Add the task to the queue
      this.taskQueue.push({ task: fullTask, resolve, reject });

      // Process the task if a worker is available
      this.processNextTask();
    });
  }

  /**
   * Shutdown the worker pool
   */
  public async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Terminate all workers
    const terminationPromises = this.workers.map(worker => {
      return new Promise<void>((resolve) => {
        worker.once('exit', () => resolve());
        worker.terminate();
      });
    });

    await Promise.all(terminationPromises);

    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.workerMap.clear();

    console.log('Auth worker pool shut down');
  }
}

// Singleton instance
let workerPool: AuthWorkerPool | null = null;

/**
 * Retrieves the singleton instance of the authentication worker pool.
 *
 * If the worker pool has not been instantiated yet, this function creates a new instance.
 *
 * @returns The singleton AuthWorkerPool instance used for managing concurrent authentication tasks.
 */
export function getAuthWorkerPool(): AuthWorkerPool {
  if (!workerPool) {
    workerPool = new AuthWorkerPool();
  }

  return workerPool;
}
