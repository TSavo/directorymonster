import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get module path information
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    const srcPath = path.resolve(process.cwd(), 'src');
    
    // Check specific important files
    const sitesIndexPath = path.resolve(srcPath, 'components/admin/sites/index.ts');
    const sitesIndexExists = fs.existsSync(sitesIndexPath);
    
    let sitesIndexContent = null;
    if (sitesIndexExists) {
      sitesIndexContent = fs.readFileSync(sitesIndexPath, 'utf8');
    }
    
    res.status(200).json({
      cwd: process.cwd(),
      nodeModulesPath,
      srcPath,
      sitesIndexExists,
      sitesIndexContent,
      tsconfig: path.resolve(process.cwd(), 'tsconfig.json'),
      nextConfig: path.resolve(process.cwd(), 'next.config.js'),
      pathsExist: {
        sitesIndex: sitesIndexExists,
        tsconfig: fs.existsSync(path.resolve(process.cwd(), 'tsconfig.json')),
        nextConfig: fs.existsSync(path.resolve(process.cwd(), 'next.config.js'))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
