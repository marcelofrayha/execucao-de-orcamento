import * as XLSX from 'xlsx';

function unmergeAllCells(worksheet: XLSX.WorkSheet): void {
    if (worksheet['!merges']) {
        delete worksheet['!merges'];
    }
}

function convertToNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    if (typeof value === 'number') {
        return Math.round(value);
    }
    const strValue = String(value).replace('.', '').replace(',', '.');
    const numValue = parseFloat(strValue.replace(/[^\d.-]/g, ''));
    return isNaN(numValue) ? 0 : Math.round(numValue);
}

export function processTable(workbook: XLSX.WorkBook, month: number, year: number, minCol: number, maxCol: number): XLSX.WorkBook {
    const sheetName = workbook.SheetNames[0];
    let worksheet = workbook.Sheets[sheetName];

    unmergeAllCells(worksheet);

    let data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    // Remove the first row
    data = data.slice(1);

    // Set column G line 1 equal to column A line 1
    data[0][6] = data[0][0];

    // Remove column F (index 5)
    data.forEach(row => row.splice(5, 1));
    // Set column E line 1 equal to "Atividade/Projeto"
    data[0][4] = "Atividade/Projeto";
    // Find the cell in column E that starts with "Atividade/Projeto"
    let startIndex = data.findIndex(row => typeof row[4] === 'string' && row[4].startsWith("Atividade/Projeto"));

    // If such a cell is found, fill the empty cells below it
    if (startIndex !== -1) {
        let lastValue = data[startIndex][4];
        for (let i = startIndex + 1; i < data.length; i++) {
            if (!data[i][4] || data[i][4] === "" || data[i][4] === "-") {
                data[i][4] = typeof lastValue === 'string' && lastValue.includes("- ") 
                    ? lastValue.split("- ", 2)[1] 
                    : lastValue;
            } else {
                lastValue = data[i][4];
            }
        }
    }
    // Set column C line 1 equal to "Unidade Orçamentária"
    data[0][2] = "Unidade Orçamentária";
    // Process column C
    let lastValue: string | null = null;
    data.forEach(row => {
        if (typeof row[2] === 'string' && row[2].startsWith("Unidade")) {
            lastValue = row[2].includes(": ") ? row[2].split(": ", 2)[1] : row[2];
        } else if (!row[2] || row[2] === "" || row[2] === "-") {
            if (lastValue !== null) {
                row[2] = lastValue;
            }
        }
    });
    // Remove columns D (index 3) and C (index 2)
    data.forEach(row => {
        row.splice(3, 1);
        row.splice(1, 1);
    });

    // Remove columns C (index 2) and D (index 3)
    data.forEach(row => {
        row.splice(3, 1);
        row.splice(2, 1);
    });

    // Remove rows where column E (now column C) is empty
    data = data.filter(row => row[2] !== undefined && row[2] !== null && row[2] !== "");

    // Remove the first column
    data.forEach(row => row.shift());

    // Remove the first row
    data.shift();
    // Select only the desired columns
    const desiredColumns = [0, 1, 2, 3, 7, 9];
    data = data.map(row => desiredColumns.map(col => row[col]));
    // Rename the columns
    const headers = [
        "unidade_orcamentaria",
        "fonte_de_recurso",
        "elemento_despesa",
        "orcado",
        "saldo",
        "empenhado"
    ];
    // Add new columns at the beginning of the DataFrame
    data.unshift(headers);
    data.forEach((row, index) => {
        if (index === 0) {
            row.unshift('mes', 'ano');
        } else {
            row.unshift(month, year);
        }
    });
    // Convert columns D to V to numbers
    for (let col = minCol; col < maxCol; col++) {
        for (let row = 1; row < data.length; row++) {
            data[row][col] = convertToNumber(data[row][col]);
        }
    }
    // Create a new workbook and add the processed data
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Processed Data');

    return newWorkbook;
}

