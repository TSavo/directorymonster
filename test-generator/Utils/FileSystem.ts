/**
 * @fileoverview File system utility functions for the test generator.
 * Handles directory creation, file reading and writing, and error handling.
 */

import fs from 'fs';
import path from 'path';

/**
 * FileSystem utility class for handling file operations
 */
class FileSystem {
  /**
   * Check if a file exists
   * @param {string} filePath - Path to the file to check
   * @returns {boolean} True if the file exists, false otherwise
   */
  static fileExists(filePath) {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (error) {
      console.error(`Error checking if file exists: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if a directory exists
   * @param {string} dirPath - Path to the directory to check
   * @returns {boolean} True if the directory exists, false otherwise
   */
  static directoryExists(dirPath) {
    try {
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch (error) {
      console.error(`Error checking if directory exists: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a directory and any necessary parent directories
   * @param {string} dirPath - Path to the directory to create
   * @returns {boolean} True if the directory was created successfully or already exists
   */
  static createDirectory(dirPath) {
    try {
      if (this.directoryExists(dirPath)) {
        return true;
      }
      
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`Error creating directory: ${error.message}`);
      return false;
    }
  }

  /**
   * Read a file with error handling
   * @param {string} filePath - Path to the file to read
   * @param {string} [encoding='utf8'] - Encoding to use when reading the file
   * @returns {string|null} The file contents or null if an error occurred
   */
  static readFile(filePath, encoding = 'utf8') {
    try {
      if (!this.fileExists(filePath)) {
        console.error(`File not found: ${filePath}`);
        return null;
      }
      
      return fs.readFileSync(filePath, encoding);
    } catch (error) {
      console.error(`Error reading file: ${error.message}`);
      return null;
    }
  }

  /**
   * Write to a file with error handling
   * @param {string} filePath - Path to the file to write
   * @param {string} content - Content to write to the file
   * @param {boolean} [overwrite=false] - Whether to overwrite the file if it already exists
   * @returns {boolean} True if the file was written successfully
   */
  static writeFile(filePath, content, overwrite = false) {
    try {
      // Check if file exists and overwrite is not allowed
      if (this.fileExists(filePath) && !overwrite) {
        console.error(`File already exists and overwrite is not allowed: ${filePath}`);
        return false;
      }
      
      // Ensure the directory exists
      const dirPath = path.dirname(filePath);
      this.createDirectory(dirPath);
      
      // Write the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully wrote file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error writing file: ${error.message}`);
      return false;
    }
  }

  /**
   * Append to a file with error handling
   * @param {string} filePath - Path to the file to append to
   * @param {string} content - Content to append to the file
   * @returns {boolean} True if the content was appended successfully
   */
  static appendFile(filePath, content) {
    try {
      // Ensure the directory exists
      const dirPath = path.dirname(filePath);
      this.createDirectory(dirPath);
      
      // Append to the file
      fs.appendFileSync(filePath, content, 'utf8');
      console.log(`Successfully appended to file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error appending to file: ${error.message}`);
      return false;
    }
  }

  /**
   * List files in a directory with error handling
   * @param {string} dirPath - Path to the directory to list
   * @param {RegExp} [pattern] - Pattern to match filenames against
   * @returns {string[]|null} Array of file paths, or null if an error occurred
   */
  static listFiles(dirPath, pattern = null) {
    try {
      if (!this.directoryExists(dirPath)) {
        console.error(`Directory not found: ${dirPath}`);
        return null;
      }
      
      let files = fs.readdirSync(dirPath);
      
      // Filter files based on pattern and only include files (not directories)
      files = files
        .filter(file => {
          const filePath = path.join(dirPath, file);
          const isFile = fs.statSync(filePath).isFile();
          return isFile && (!pattern || pattern.test(file));
        })
        .map(file => path.join(dirPath, file));
      
      return files;
    } catch (error) {
      console.error(`Error listing files: ${error.message}`);
      return null;
    }
  }

  /**
   * Recursively list all files in a directory and its subdirectories
   * @param {string} dirPath - Path to the directory to list
   * @param {RegExp} [pattern] - Pattern to match filenames against
   * @returns {string[]|null} Array of file paths, or null if an error occurred
   */
  static listFilesRecursive(dirPath, pattern = null) {
    try {
      if (!this.directoryExists(dirPath)) {
        console.error(`Directory not found: ${dirPath}`);
        return null;
      }
      
      let results = [];
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively process subdirectories
          const subFiles = this.listFilesRecursive(entryPath, pattern);
          if (subFiles) {
            results = results.concat(subFiles);
          }
        } else if (!pattern || pattern.test(entry.name)) {
          // Add file if it matches the pattern or no pattern was provided
          results.push(entryPath);
        }
      }
      
      return results;
    } catch (error) {
      console.error(`Error listing files recursively: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete a file with error handling
   * @param {string} filePath - Path to the file to delete
   * @returns {boolean} True if the file was deleted successfully
   */
  static deleteFile(filePath) {
    try {
      if (!this.fileExists(filePath)) {
        console.warn(`File to delete not found: ${filePath}`);
        return true; // File is already gone, so deletion "succeeded"
      }
      
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
      return false;
    }
  }

  /**
   * Copy a file with error handling
   * @param {string} sourcePath - Path to the source file
   * @param {string} destPath - Path to the destination file
   * @param {boolean} [overwrite=false] - Whether to overwrite the destination file if it already exists
   * @returns {boolean} True if the file was copied successfully
   */
  static copyFile(sourcePath, destPath, overwrite = false) {
    try {
      if (!this.fileExists(sourcePath)) {
        console.error(`Source file not found: ${sourcePath}`);
        return false;
      }
      
      if (this.fileExists(destPath) && !overwrite) {
        console.error(`Destination file already exists and overwrite is not allowed: ${destPath}`);
        return false;
      }
      
      // Ensure the destination directory exists
      const destDir = path.dirname(destPath);
      this.createDirectory(destDir);
      
      // Copy the file
      fs.copyFileSync(
        sourcePath, 
        destPath, 
        overwrite ? 0 : fs.constants.COPYFILE_EXCL
      );
      
      console.log(`Copied file from ${sourcePath} to ${destPath}`);
      return true;
    } catch (error) {
      console.error(`Error copying file: ${error.message}`);
      return false;
    }
  }

  /**
   * Get the relative path from a base directory
   * @param {string} fullPath - The full path
   * @param {string} baseDir - The base directory
   * @returns {string} The relative path
   */
  static getRelativePath(fullPath, baseDir) {
    return path.relative(baseDir, fullPath);
  }

  /**
   * Resolve a path relative to the current working directory
   * @param {string} relativePath - The relative path to resolve
   * @returns {string} The absolute path
   */
  static resolvePath(relativePath) {
    return path.resolve(process.cwd(), relativePath);
  }

  /**
   * Join path segments
   * @param paths - Path segments to join
   * @returns The joined path
   */
  static joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Get the directory name from a path
   * @param filePath - The file path
   * @returns The directory name
   */
  static getDirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get the base name (filename) from a path
   * @param filePath - The file path
   * @param ext - Optional extension to remove
   * @returns The base name
   */
  static getBasename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get the extension of a file
   * @param filePath - The file path
   * @returns The file extension (including the dot)
   */
  static getExtension(filePath: string): string {
    return path.extname(filePath);
  }
}

export { FileSystem };
