import * as XLSX from "xlsx";

export const writeWorkbook = (
  fileName: string,
  sheets: Record<string, object[]>,
): void => {
  const wb = XLSX.utils.book_new();
  for (const [sheetName, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ note: "no rows" }]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  }
  XLSX.writeFile(wb, fileName);
};

export const timeStampForFile = (): string =>
  new Date().toISOString().replace(/[:.]/g, "-");
