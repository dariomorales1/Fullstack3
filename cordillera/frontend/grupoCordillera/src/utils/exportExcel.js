const escapeXml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const normalizeSheetName = (value, index) => {
    const fallback = `Hoja${index + 1}`;
    const sanitized = String(value || fallback)
        .replace(/[\\/:*?[\]]/g, ' ')
        .trim();

    return (sanitized || fallback).slice(0, 31);
};

const getCellType = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return 'Number';
    }

    if (typeof value === 'boolean') {
        return 'Boolean';
    }

    return 'String';
};

const buildCell = (value) => {
    const type = getCellType(value);
    const normalized = type === 'Boolean' ? (value ? 1 : 0) : value;
    return `<Cell><Data ss:Type="${type}">${escapeXml(normalized ?? '')}</Data></Cell>`;
};

const buildRow = (values) => `<Row>${values.map(buildCell).join('')}</Row>`;

const buildWorksheet = (sheet, index) => {
    const name = normalizeSheetName(sheet.name, index);
    const columns = Array.isArray(sheet.columns) ? sheet.columns : [];
    const rows = Array.isArray(sheet.rows) ? sheet.rows : [];
    const tableRows = [
        buildRow(columns),
        ...rows.map((row) => buildRow(columns.map((column) => row?.[column] ?? ''))),
    ].join('');

    return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${tableRows}</Table></Worksheet>`;
};

export const exportWorkbook = (fileName, sheets) => {
    if (!Array.isArray(sheets) || !sheets.length) {
        return;
    }

    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${sheets.map(buildWorksheet).join('')}
</Workbook>`;

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
