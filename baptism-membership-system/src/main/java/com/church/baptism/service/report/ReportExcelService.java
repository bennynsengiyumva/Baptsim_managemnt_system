package com.church.baptism.service.report;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@Service
public class ReportExcelService {

    public byte[] generateReport(
            String title,
            List<String> infoLines,
            String dateRange,
            List<String> headers,
            List<List<String>> rows,
            Map<String, Long> summary
    ) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Report");

            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());

            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            boldFont.setFontHeightInPoints((short) 11);

            Font normalFont = workbook.createFont();
            normalFont.setFontHeightInPoints((short) 11);

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle infoStyle = workbook.createCellStyle();
            infoStyle.setFont(normalFont);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setFont(normalFont);
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            CellStyle summaryLabelStyle = workbook.createCellStyle();
            summaryLabelStyle.setFont(boldFont);
            summaryLabelStyle.setBorderBottom(BorderStyle.THIN);
            summaryLabelStyle.setBorderLeft(BorderStyle.THIN);
            summaryLabelStyle.setBorderRight(BorderStyle.THIN);

            CellStyle summaryValueStyle = workbook.createCellStyle();
            summaryValueStyle.setFont(normalFont);
            summaryValueStyle.setBorderBottom(BorderStyle.THIN);
            summaryValueStyle.setBorderLeft(BorderStyle.THIN);
            summaryValueStyle.setBorderRight(BorderStyle.THIN);

            int rowIdx = 0;

            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(title);
            titleCell.setCellStyle(titleStyle);

            rowIdx++;

            for (String line : infoLines) {
                Row infoRow = sheet.createRow(rowIdx++);
                Cell infoCell = infoRow.createCell(0);
                infoCell.setCellValue(line);
                infoCell.setCellStyle(infoStyle);
            }

            if (dateRange != null && !dateRange.isEmpty()) {
                Row dateRow = sheet.createRow(rowIdx++);
                Cell dateCell = dateRow.createCell(0);
                dateCell.setCellValue(dateRange);
                dateCell.setCellStyle(infoStyle);
            }

            rowIdx++;

            Row headerRow = sheet.createRow(rowIdx++);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }

            for (List<String> rowData : rows) {
                Row dataRow = sheet.createRow(rowIdx++);
                for (int i = 0; i < rowData.size(); i++) {
                    Cell cell = dataRow.createCell(i);
                    cell.setCellValue(rowData.get(i) != null ? rowData.get(i) : "");
                    cell.setCellStyle(dataStyle);
                }
            }

            rowIdx++;

            Row summaryHeaderRow = sheet.createRow(rowIdx++);
            Cell summaryTitleCell = summaryHeaderRow.createCell(0);
            summaryTitleCell.setCellValue("Summary");
            summaryTitleCell.setCellStyle(summaryLabelStyle);

            for (Map.Entry<String, Long> entry : summary.entrySet()) {
                Row summaryRow = sheet.createRow(rowIdx++);
                Cell labelCell = summaryRow.createCell(0);
                labelCell.setCellValue(entry.getKey());
                labelCell.setCellStyle(summaryLabelStyle);
                Cell valueCell = summaryRow.createCell(1);
                valueCell.setCellValue(entry.getValue());
                valueCell.setCellStyle(summaryValueStyle);
            }

            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Excel report", e);
        }
    }
}
