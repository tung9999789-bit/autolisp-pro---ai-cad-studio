export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  let i = 0;
  let j = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  // Simple longest common subsequence / greedy line diff
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length) {
      if (oldLines[i] === newLines[j]) {
        result.push({
          type: "unchanged",
          content: oldLines[i],
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
        i++;
        j++;
      } else {
        // Look ahead to see if old line appears later in newLines
        const foundInNew = newLines.slice(j, j + 5).indexOf(oldLines[i]);
        const foundInOld = oldLines.slice(i, i + 5).indexOf(newLines[j]);

        if (foundInNew !== -1) {
          // New lines were added
          result.push({
            type: "added",
            content: newLines[j],
            newLineNumber: newLineNum++,
          });
          j++;
        } else if (foundInOld !== -1) {
          // Old lines were removed
          result.push({
            type: "removed",
            content: oldLines[i],
            oldLineNumber: oldLineNum++,
          });
          i++;
        } else {
          // Changed line (one removed, one added)
          result.push({
            type: "removed",
            content: oldLines[i],
            oldLineNumber: oldLineNum++,
          });
          result.push({
            type: "added",
            content: newLines[j],
            newLineNumber: newLineNum++,
          });
          i++;
          j++;
        }
      }
    } else if (i < oldLines.length) {
      result.push({
        type: "removed",
        content: oldLines[i],
        oldLineNumber: oldLineNum++,
      });
      i++;
    } else if (j < newLines.length) {
      result.push({
        type: "added",
        content: newLines[j],
        newLineNumber: newLineNum++,
      });
      j++;
    }
  }

  return result;
}
