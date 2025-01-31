export const mean = (sample: number[]) =>
  sample.reduce((acc, number) => acc + number, 0) / sample.length;
export const variance = (sample: number[], mean: number) =>
  sample.reduce((acc, number) => acc + Math.pow(number - mean, 2)) /
  (sample.length - 1);
export const tStat = (
  mean1: number,
  var1: number,
  n1: number,
  mean2: number,
  var2: number,
  n2: number
) => (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);
