<?php

namespace App\Services;

use ZipArchive;

class ExcelExportService
{
    /**
     * Build an OpenXML .xlsx file and write it to a temporary path or stream.
     *
     * @param string $sheetTitle
     * @param array $headers
     * @param iterable $rows
     * @param array $colWidths
     * @return string Path to temporary .xlsx file
     */
    public function generate(string $sheetTitle, array $headers, iterable $rows, array $colWidths = []): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'xlsx_');
        $zip = new ZipArchive();

        if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException("Unable to create zip file at {$tempFile}");
        }

        // 1. [Content_Types].xml
        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' .
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' .
            '<Default Extension="xml" ContentType="application/xml"/>' .
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' .
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' .
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' .
            '</Types>';
        $zip->addFromString('[Content_Types].xml', $contentTypes);

        // 2. _rels/.rels
        $rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' .
            '</Relationships>';
        $zip->addFromString('_rels/.rels', $rootRels);

        // 3. xl/_rels/workbook.xml.rels
        $wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' .
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' .
            '</Relationships>';
        $zip->addFromString('xl/_rels/workbook.xml.rels', $wbRels);

        // 4. xl/workbook.xml
        $safeSheetTitle = htmlspecialchars(substr($sheetTitle, 0, 31), ENT_XML1, 'UTF-8');
        $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' .
            '<sheets>' .
            '<sheet name="' . $safeSheetTitle . '" sheetId="1" r:id="rId1"/>' .
            '</sheets>' .
            '</workbook>';
        $zip->addFromString('xl/workbook.xml', $workbook);

        // 5. xl/styles.xml (Professional Corporate Theme: Brand Blue header, zebra rows, clean borders)
        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' .
            '<fonts count="3">' .
            '  <font><sz val="10"/><name val="Segoe UI"/><color rgb="FF0F172A"/></font>' . // 0: Normal
            '  <font><b/><sz val="11"/><name val="Segoe UI"/><color rgb="FFFFFFFF"/></font>' . // 1: Header bold white
            '  <font><b/><sz val="10"/><name val="Segoe UI"/><color rgb="FF1E40AF"/></font>' . // 2: Bold blue
            '</fonts>' .
            '<fills count="4">' .
            '  <fill><patternFill patternType="none"/></fill>' . // 0: none
            '  <fill><patternFill patternType="gray125"/></fill>' . // 1: gray125
            '  <fill><patternFill patternType="solid"><fgColor rgb="FF1E40AF"/></patternFill></fill>' . // 2: Brand blue
            '  <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>' . // 3: Zebra light
            '</fills>' .
            '<borders count="2">' .
            '  <border><left/><right/><top/><bottom/><diagonal/></border>' . // 0: none
            '  <border>' . // 1: thin light gray
            '    <left style="thin"><color rgb="FFE2E8F0"/></left>' .
            '    <right style="thin"><color rgb="FFE2E8F0"/></right>' .
            '    <top style="thin"><color rgb="FFE2E8F0"/></top>' .
            '    <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>' .
            '  </border>' .
            '</borders>' .
            '<cellStyleXfs count="1">' .
            '  <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>' .
            '</cellStyleXfs>' .
            '<cellXfs count="4">' .
            '  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf>' . // 0: Regular cell
            '  <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>' . // 1: Header
            '  <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>' . // 2: Zebra cell
            '  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>' . // 3: Centered cell
            '</cellXfs>' .
            '</styleSheet>';
        $zip->addFromString('xl/styles.xml', $styles);

        // 6. xl/worksheets/sheet1.xml
        $sheetXml = $this->buildSheetXml($headers, $rows, $colWidths);
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);

        $zip->close();

        return $tempFile;
    }

    private function buildSheetXml(array $headers, iterable $rows, array $colWidths): string
    {
        $numCols = count($headers);
        $lastColLetter = $this->getColumnLetter($numCols);

        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' .
            '<sheetViews>' .
            '  <sheetView tabSelected="1" workbookViewId="0">' .
            '    <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' .
            '  </sheetView>' .
            '</sheetViews>' .
            '<sheetFormatPr defaultRowHeight="20"/>';

        // Column widths
        $xml .= '<cols>';
        for ($i = 0; $i < $numCols; $i++) {
            $colIndex = $i + 1;
            $width = $colWidths[$i] ?? 18;
            $xml .= '<col min="' . $colIndex . '" max="' . $colIndex . '" width="' . $width . '" customWidth="1"/>';
        }
        $xml .= '</cols>';

        $xml .= '<sheetData>';

        // Row 1: Header
        $xml .= '<row r="1" ht="28" customHeight="1">';
        foreach ($headers as $colIdx => $headerText) {
            $cellRef = $this->getColumnLetter($colIdx + 1) . '1';
            $safeVal = htmlspecialchars((string) $headerText, ENT_XML1, 'UTF-8');
            $xml .= '<c r="' . $cellRef . '" s="1" t="inlineStr"><is><t>' . $safeVal . '</t></is></c>';
        }
        $xml .= '</row>';

        // Rows 2..N: Data
        $rowNum = 2;
        foreach ($rows as $rowData) {
            $isZebra = ($rowNum % 2 === 1);
            $styleId = $isZebra ? 2 : 0;
            $xml .= '<row r="' . $rowNum . '" ht="22" customHeight="1">';

            $colIdx = 0;
            foreach ($rowData as $val) {
                if ($colIdx >= $numCols) break;
                $cellRef = $this->getColumnLetter($colIdx + 1) . $rowNum;

                if (is_numeric($val) && !is_string($val)) {
                    $xml .= '<c r="' . $cellRef . '" s="' . $styleId . '"><v>' . $val . '</v></c>';
                } else {
                    $safeVal = htmlspecialchars((string) ($val ?? ''), ENT_XML1, 'UTF-8');
                    $xml .= '<c r="' . $cellRef . '" s="' . $styleId . '" t="inlineStr"><is><t>' . $safeVal . '</t></is></c>';
                }
                $colIdx++;
            }

            $xml .= '</row>';
            $rowNum++;
        }

        $xml .= '</sheetData>';

        // Auto filter on headers
        $totalRows = max(1, $rowNum - 1);
        $xml .= '<autoFilter ref="A1:' . $lastColLetter . $totalRows . '"/>';

        $xml .= '</worksheet>';

        return $xml;
    }

    private function getColumnLetter(int $colNum): string
    {
        $letter = '';
        while ($colNum > 0) {
            $remainder = ($colNum - 1) % 26;
            $letter = chr(65 + $remainder) . $letter;
            $colNum = (int) (($colNum - $remainder) / 26);
        }
        return $letter;
    }
}
