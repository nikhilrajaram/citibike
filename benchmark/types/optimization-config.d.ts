export type QueryParameters = {
  query: string;
  replacements: Record<string, string>;
};

export type QueryConfig = {
  baseline: QueryParameters;
  benchmark: QueryParameters;
  replacementScript: string;
  populateBefore: boolean;
};

export type OptimizationConfig = {
  queries: QueryConfig[];
};
