import * as XLSX from 'xlsx';

function convertToNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    if (typeof value === 'number') {
        return Math.round(value);
    }

    let strValue = value.toString().trim();
    const isNegative = strValue.startsWith('(') && strValue.endsWith(')');

    strValue = strValue.replace('.', '').replace(',', '.');
    strValue = strValue.replace(/[^\d.-]/g, '');

    const number = parseFloat(strValue);
    if (isNaN(number)) {
        return 0;
    }
    return isNegative ? -Math.round(number) : Math.round(number);
}

function removeLeadingSpace(value: any): any {
    if (typeof value === 'string') {
        return value.trimStart();
    }
    return value;
}

function mapColumnB(value: string): string {
    const mappings: { [key: string]: string } = {
        '17090000000': '17090000000 - Transferência da União referente à Compensação Financeira de Recursos Hídricos',
        '17100003210': '17100003210 - Transferência Especial dos Estados - (Outros) - Emenda Parlamentar Individual',
        '17000003110': '17000003110 - Outras Transferências de Convênios ou Instrumentos Congêneres da União - (Outros) - Emenda Parlamentar Individual',
        '27100003210': '27100003210 - Transferência Especial dos Estados - (outros) - Emenda Parlamentar Individual',
        '16000003110': '16000003110 - Transf. Fundo a Fundo de Rec. do SUS prov. do Governo Federal - Bloco de Manut. das Ações e Serviços Públicos de Saúde - Emenda Parlamentar Individual',
        '16210003210': '16210003210 - Transferências Fundo a Fundo de Recursos do SUS provenientes do Governo Estadual - Emenda Parlamentar Individual',
        '27080000000': '27080000000 - Transferência da União Referente à Compensação Financeira de Recursos Minerais',
        '27060003110': '27060003110 - Transferência Especial da União - Emenda Parlamentar Individual',
        '26210003210': '26210003210 - Transferências Fundo a Fundo de Recursos do SUS provenientes do Governo Estadual - Emenda Parlamentar Individual'
    };

    for (const prefix in mappings) {
        if (value.startsWith(prefix)) {
            return mappings[prefix];
        }
    }
    return value;
}

export function processExcel(workbook: XLSX.WorkBook, startCol: number, endCol: number): any[][] {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // Remove leading spaces in column A (index 0)
    data.forEach(row => {
        if (row[0]) {
            row[0] = removeLeadingSpace(row[0]);
        }
    });

    // Apply mapping to column B (index 1)
    data.forEach(row => {
        if (row[1]) {
            row[1] = mapColumnB(row[1]);
        }
    });

    // Convert specified columns to numbers, except the first row
    for (let col = startCol; col < endCol; col++) {
        for (let row = 1; row < data.length; row++) {
            if (data[row][col] !== undefined) {
                data[row][col] = convertToNumber(data[row][col]);
            }
        }
    }

    // Return the processed data
    return data;
}
