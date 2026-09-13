/**
 * diff.ts
 * Word-level and token-level visual diff engine for DocSurgical AI.
 * Computes additions, deletions, and unchanged segments between original and modified blocks.
 */

export interface DiffSegment {
  type: "equal" | "added" | "removed";
  value: string;
}

export interface DiffStats {
  wordsOriginal: number;
  wordsModified: number;
  wordsAdded: number;
  wordsRemoved: number;
}

/**
 * Tokenizes text into words and whitespaces to preserve visual cadence.
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  // Tokenize words, numbers, punctuation, and whitespace groups
  const tokens = text.match(/\s+|[^\s]+/g);
  return tokens || [];
}

/**
 * Computes LCS (Longest Common Subsequence) based word-level diff.
 */
export function computeWordDiff(original: string, modified: string): {
  segments: DiffSegment[];
  stats: DiffStats;
} {
  const origTokens = tokenize(original || "");
  const modTokens = tokenize(modified || "");

  const n = origTokens.length;
  const m = modTokens.length;

  // LCS Matrix
  // Use 1D rolling array if large, but blocks are typically <= 1000 tokens
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origTokens[i - 1] === modTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find segments
  let i = n;
  let j = m;
  const rawSegments: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === modTokens[j - 1]) {
      rawSegments.push({ type: "equal", value: origTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawSegments.push({ type: "added", value: modTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawSegments.push({ type: "removed", value: origTokens[i - 1] });
      i--;
    }
  }

  rawSegments.reverse();

  // Consolidate consecutive segments of same type
  const consolidated: DiffSegment[] = [];
  for (const seg of rawSegments) {
    if (consolidated.length > 0 && consolidated[consolidated.length - 1].type === seg.type) {
      consolidated[consolidated.length - 1].value += seg.value;
    } else {
      consolidated.push({ ...seg });
    }
  }

  // Calculate statistics (word count ignoring pure whitespace)
  const isWord = (s: string) => /\S/.test(s);
  const origWordList = origTokens.filter(isWord);
  const modWordList = modTokens.filter(isWord);

  let wordsAdded = 0;
  let wordsRemoved = 0;

  for (const seg of consolidated) {
    const wordCount = (seg.value.match(/\S+/g) || []).length;
    if (seg.type === "added") wordsAdded += wordCount;
    if (seg.type === "removed") wordsRemoved += wordCount;
  }

  return {
    segments: consolidated,
    stats: {
      wordsOriginal: origWordList.length,
      wordsModified: modWordList.length,
      wordsAdded,
      wordsRemoved,
    },
  };
}
