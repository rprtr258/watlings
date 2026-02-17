/**
 * Simple patch implementation for unified diff format.
 * Supports 'c' (change) and 'a' (add) operations.
 * Format: "start,endcstart2" or "startcstart2" for changes
 * Format: "startastart2" for additions (lines added after start)
 * Example: "17c17", "22,23c22", "38a39,47"
 */

export function parsePatch(patchString: string): Array<{
  start: number;
  deleteCount: number;
  addLines: string[];
}> {
  // Normalize line endings
  patchString = patchString.replace(/\r\n/g, '\n').replace(/\r/g, '');
  
  const patches = [];
  const lines = patchString.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const header = lines[i];
    if (!header || !/[acd]/.test(header)) {
      i++;
      continue;
    }
    
    // Parse header like "17c17", "22,23c22", or "38a39,47"
    const match = header.match(/^(\d+)(?:,(\d+))?([acd])(\d+)(?:,(\d+))?$/);
    if (!match) {
      i++;
      continue;
    }
    
    const [, startStr, endStr, operation] = match;
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : start;
    
    // Skip header
    i++;
    
    // Collect deletion lines (start with '<') for 'c' and 'd' operations
    const delLines: string[] = [];
    if (operation === 'c' || operation === 'd') {
      while (i < lines.length && lines[i].startsWith('<')) {
        delLines.push(lines[i].substring(2)); // Remove '< ' prefix
        i++;
      }
    }
    
    // Skip '---' separator if present (for 'c' operations)
    if (operation === 'c' && i < lines.length && lines[i] === '---') {
      i++;
    }
    
    // Collect addition lines (start with '>') for 'c' and 'a' operations
    const addLines: string[] = [];
    if (operation === 'c' || operation === 'a') {
      while (i < lines.length && lines[i].startsWith('>')) {
        addLines.push(lines[i].substring(2)); // Remove '> ' prefix
        i++;
      }
    }
    
    // For 'a' operation, deleteCount is 0 (just adding lines)
    const deleteCount = operation === 'a' ? 0 : end - start + 1;
    
    patches.push({ start, deleteCount, addLines });
  }
  
  return patches;
}

export function patch(patchString: string, targetString: string): string {
  // Normalize line endings
  targetString = targetString.replace(/\r\n/g, '\n').replace(/\r/g, '');
  patchString = patchString.replace(/\r\n/g, '\n').replace(/\r/g, '');
  
  const targetLines = targetString.split('\n');
  const patches = parsePatch(patchString);
  
  // Apply patches in reverse order to maintain correct line numbers
  patches.sort((a, b) => b.start - a.start);
  
  for (const { start, deleteCount, addLines } of patches) {
    // Validate start is within bounds
    if (start < 1 || start > targetLines.length + (deleteCount === 0 ? 1 : 0)) {
      throw new Error(`Patch start line ${start} is out of bounds`);
    }
    
    // Apply the patch
    targetLines.splice(start - 1, deleteCount, ...addLines);
  }
  
  return targetLines.join('\n');
}
