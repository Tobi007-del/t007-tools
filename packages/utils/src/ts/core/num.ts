// Validators

export { clamp } from "sia-reactor/utils";

/**
 * Finds the longest increasing subsequence in an array of numbers.
 * @param array The input array of numbers
 * @returns An array of indices representing the longest increasing subsequence
 */
export function longestIncreasingSubsequence(array: number[]): number[] {
  const n = array.length,
    parent = new Array<number>(n),
    tails: number[] = [];
  for (let i = 0; i < n; i++) {
    const value = array[i];
    if (value === -1) continue; // Ignore newly created nodes
    let left = 0;
    let right = tails.length;
    while (left < right) {
      const mid = (left + right) >> 1;
      if (array[tails[mid]] < value) left = mid + 1;
      else right = mid;
    }
    if (left > 0) parent[i] = tails[left - 1];
    else parent[i] = -1;
    tails[left] = i;
  }
  if (!tails.length) return [];
  const result: number[] = []; // Reconstruct sequence
  let k = tails[tails.length - 1];
  while (k >= 0) result.push(k), (k = parent[k]);
  return result.reverse(), result;
} // LIS implementation: Returns indices of the stable subsequence
