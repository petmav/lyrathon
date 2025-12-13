export function vectorToSql(values: number[]): string {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Vector must contain at least one value.');
  }

  return `[${values.join(',')}]`;
}
