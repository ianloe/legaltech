declare module 'diff-match-patch' {
  export class diff_match_patch {
    diff_main(text1: string, text2: string): [number, string][];
    diff_cleanupSemantic(diffs: [number, string][]): void;
  }
}

declare module 'mammoth' {
  export function convertToHtml(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}
