import type { ClickHouseSummary } from "@clickhouse/client-common/dist/clickhouse_types";
import fs from "fs";
import path from "path";

import { OptimizationConfig, QueryConfig } from "./types/optimization-config";
import { getClient } from "./util/get-client";
import { replaceQueryPlaceholders } from "./util/placeholders";
import { runScriptsInFolder } from "./util/run-scripts-in-folder";
import { beforeAllOptimizations } from "./util/setup";
import { mean, tStat, variance } from "./util/summary-stats";
import { cleanup } from "./util/teardown";

type BenchmarkResult = Record<
  string,
  { baseline: ClickHouseSummary; benchmark: ClickHouseSummary }[]
>;

const optimizationsDir = "optimizations";

const executionSampleSize = 60;

const client = getClient();

let beforeExit: ((...args: any[]) => Promise<void>) | undefined = undefined;

process.on("SIGINT", async () => {
  await cleanup(beforeExit);
});

process.on("exit", async () => {
  await cleanup(beforeExit);
});

process.on("uncaughtException", async (err) => {
  console.error(err);
  await cleanup(beforeExit);
});

const readFile = (filePath: string) => fs.readFileSync(filePath).toString();

const buildQueries = async (queryConfig: QueryConfig) => {
  const { getReplacements } = await import(
    `./queries/${queryConfig.replacementScript}`
  );
  const replacements = await getReplacements();
  const baselineQuery = replaceQueryPlaceholders(
    path.join("queries", queryConfig.baseline.query),
    { ...replacements, ...queryConfig.baseline.replacements }
  );
  const benchmarkQuery = replaceQueryPlaceholders(
    path.join("queries", queryConfig.benchmark.query),
    { ...replacements, ...queryConfig.benchmark.replacements }
  );

  return { baselineQuery, benchmarkQuery };
};

const runBenchmark = async () => {
  await beforeAllOptimizations();

  const optimizations = fs
    .readdirSync(optimizationsDir)
    .filter((file) => !file.startsWith("_") && !file.startsWith("."));

  const data: BenchmarkResult = {};

  for (let optimizationName of optimizations) {
    const optimizationDir = path.join("optimizations", optimizationName);
    const setupPath = path.join(optimizationDir, "setup");
    const teardownPath = path.join(optimizationDir, "teardown");

    beforeExit = async () => {
      console.log("cleaning up", { optimization: optimizationName });
      await runScriptsInFolder(teardownPath, true);
    };

    const { queries: queryConfigs } = JSON.parse(
      readFile(path.join(optimizationDir, "config.json"))
    ) as OptimizationConfig;

    console.log("running setup", { optimization: optimizationName });
    await runScriptsInFolder(setupPath);

    for (let queryConfig of queryConfigs) {
      console.log("running benchmarks", { queryConfig });
      try {
        const warmupRuns = 5;
        for (let i = 0; i < executionSampleSize + warmupRuns; i++) {
          process.stdout.write(`running query ${i}\r`);

          const { baselineQuery, benchmarkQuery } = await buildQueries(
            queryConfig
          );

          // randomize execution order to avoid bias
          const datum = {} as {
            baseline: ClickHouseSummary;
            benchmark: ClickHouseSummary;
          };
          for (let query of [baselineQuery, benchmarkQuery].sort(
            () => Math.random() - 0.5
          )) {
            if (query === baselineQuery) {
              const baselineSummary = (
                await client.command({
                  query: baselineQuery,
                  clickhouse_settings: {
                    use_query_cache: 0,
                    enable_reads_from_query_cache: 0,
                    enable_writes_to_query_cache: 0,
                    max_threads: 1,
                  },
                })
              ).summary;
              if (!baselineSummary) {
                throw new Error();
              }

              datum.baseline = baselineSummary;
            } else {
              const benchmarkSummary = (
                await client.command({
                  query: benchmarkQuery,
                  clickhouse_settings: {
                    use_query_cache: 0,
                    enable_reads_from_query_cache: 0,
                    enable_writes_to_query_cache: 0,
                    max_threads: 1,
                  },
                })
              ).summary;
              if (!benchmarkSummary) {
                throw new Error();
              }

              datum.benchmark = benchmarkSummary;
            }
          }

          if (i < warmupRuns) {
            continue;
          }

          if (data[optimizationName]) {
            data[optimizationName].push(datum);
          } else {
            data[optimizationName] = [datum];
          }
        }
        console.log();
      } catch (err) {
        console.error("error running benchmarks");
        console.error(err);
      } finally {
        await beforeExit();
      }
    }
  }

  return data;
};

const writeResults = (data: BenchmarkResult) => {
  const outputPath = path.join(__dirname, "results.json");
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  const headers =
    "optimization," +
    "baselineMean,baselineVariance," +
    "benchmarkMean,benchmarkVariance," +
    "tStat\n";

  const summaryCsv = Object.entries(data).reduce(
    (acc, [optimization, results]) => {
      const { baseline, benchmark } = results.reduce(
        (acc, { baseline, benchmark }) => {
          acc.baseline.push(parseInt(baseline.elapsed_ns, 10) * 1e-6);
          acc.benchmark.push(parseInt(benchmark.elapsed_ns, 10) * 1e-6);
          return acc;
        },
        {
          baseline: [] as number[],
          benchmark: [] as number[],
        }
      );

      const [baselineElapsedMean, benchmarkElapsedMean] = [
        baseline,
        benchmark,
      ].map(mean);

      const baselineElapsedVariance = variance(baseline, baselineElapsedMean);
      const benchmarkElapsedVariance = variance(
        benchmark,
        benchmarkElapsedMean
      );

      const tStatElapsed = tStat(
        benchmarkElapsedMean,
        benchmarkElapsedVariance,
        benchmark.length,
        baselineElapsedMean,
        baselineElapsedVariance,
        baseline.length
      );

      return (
        acc +
        `${optimization},` +
        `${baselineElapsedMean},${baselineElapsedVariance},` +
        `${benchmarkElapsedMean},${benchmarkElapsedVariance},` +
        `${tStatElapsed}\n`
      );
    },
    headers
  );

  const csvPath = path.join(__dirname, "summary.csv");
  fs.writeFileSync(csvPath, summaryCsv);
};

runBenchmark()
  .then(writeResults)
  .then(() => console.log("success"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
