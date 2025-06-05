export function formatName(fileName: string): string {
  // Split the filename by delimiters (".", "-")
  const parts = fileName.split(/[.-]/);

  // Capitalize the first letter of each word (except the first)
  const formattedParts = parts.map((part, index) =>
    index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
  );

  return formattedParts.join('');
}
