package com.church.baptism.service.report;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class ReportExcelService {

    // Theme colors
    private static final short PRIMARY_BLUE = IndexedColors.ROYAL_BLUE.getIndex();
    private static final short LIGHT_BLUE_INDEX = IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex();
    private static final short WHITE_INDEX = IndexedColors.WHITE.getIndex();
    private static final short BLACK_INDEX = IndexedColors.BLACK.getIndex();
    private static final short GRAY_INDEX = IndexedColors.GREY_25_PERCENT.getIndex();

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

            // === FONTS ===
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(PRIMARY_BLUE);

            Font orgFont = workbook.createFont();
            orgFont.setBold(true);
            orgFont.setFontHeightInPoints((short) 11);
            orgFont.setColor(BLACK_INDEX);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 10);
            headerFont.setColor(WHITE_INDEX);

            Font sectionFont = workbook.createFont();
            sectionFont.setBold(true);
            sectionFont.setFontHeightInPoints((short) 12);
            sectionFont.setColor(PRIMARY_BLUE);

            Font metaLabelFont = workbook.createFont();
            metaLabelFont.setBold(true);
            metaLabelFont.setFontHeightInPoints((short) 9);

            Font normalFont = workbook.createFont();
            normalFont.setFontHeightInPoints((short) 10);

            Font totalFont = workbook.createFont();
            totalFont.setBold(true);
            totalFont.setFontHeightInPoints((short) 10);
            totalFont.setColor(PRIMARY_BLUE);

            // === STYLES ===
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle orgStyle = workbook.createCellStyle();
            orgStyle.setFont(orgFont);
            orgStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(PRIMARY_BLUE);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setWrapText(true);

            CellStyle infoStyle = workbook.createCellStyle();
            infoStyle.setFont(normalFont);

            CellStyle metaLabelStyle = workbook.createCellStyle();
            metaLabelStyle.setFont(metaLabelFont);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setFont(normalFont);
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataStyle.setWrapText(true);

            CellStyle dataCenterStyle = workbook.createCellStyle();
            dataCenterStyle.setFont(normalFont);
            dataCenterStyle.setBorderBottom(BorderStyle.THIN);
            dataCenterStyle.setBorderLeft(BorderStyle.THIN);
            dataCenterStyle.setBorderRight(BorderStyle.THIN);
            dataCenterStyle.setAlignment(HorizontalAlignment.CENTER);
            dataCenterStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataCenterStyle.setWrapText(true);

            CellStyle altRowStyle = workbook.createCellStyle();
            altRowStyle.cloneStyleFrom(dataStyle);
            altRowStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            altRowStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle altRowCenterStyle = workbook.createCellStyle();
            altRowCenterStyle.cloneStyleFrom(dataCenterStyle);
            altRowCenterStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            altRowCenterStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle summaryLabelStyle = workbook.createCellStyle();
            summaryLabelStyle.setFont(metaLabelFont);
            summaryLabelStyle.setBorderBottom(BorderStyle.THIN);
            summaryLabelStyle.setBorderLeft(BorderStyle.THIN);

            CellStyle summaryValueStyle = workbook.createCellStyle();
            summaryValueStyle.setFont(totalFont);
            summaryValueStyle.setBorderBottom(BorderStyle.THIN);
            summaryValueStyle.setBorderRight(BorderStyle.THIN);

            CellStyle totalStyle = workbook.createCellStyle();
            totalStyle.setFont(totalFont);
            totalStyle.setFillForegroundColor(LIGHT_BLUE_INDEX);
            totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            totalStyle.setBorderBottom(BorderStyle.THIN);
            totalStyle.setBorderLeft(BorderStyle.THIN);
            totalStyle.setBorderRight(BorderStyle.THIN);

            int rowIdx = 0;

            // ===== HEADER BAR (blue row) =====
            Row blueBar = sheet.createRow(rowIdx++);
            blueBar.setHeightInPoints(8);
            CellStyle blueBarStyle = workbook.createCellStyle();
            blueBarStyle.setFillForegroundColor(PRIMARY_BLUE);
            blueBarStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Cell blueCell = blueBar.createCell(0);
            blueCell.setCellStyle(blueBarStyle);

            // ===== PROJECT NAME =====
            Row nameRow = sheet.createRow(rowIdx++);
            nameRow.setHeightInPoints(24);
            Cell nameCell = nameRow.createCell(0);
            nameCell.setCellValue("BAPTISM & MEMBERSHIP PREPARATION MANAGEMENT SYSTEM");
            nameCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIdx - 2, rowIdx - 2, 0, Math.max(1, headers.size() - 1)));

            // ===== ORG NAME =====
            Row orgRow = sheet.createRow(rowIdx++);
            Cell orgCell = orgRow.createCell(0);
            orgCell.setCellValue("Seventh-day Adventist Church");
            orgCell.setCellStyle(orgStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIdx - 2, rowIdx - 2, 0, Math.max(1, headers.size() - 1)));

            // ===== DATE =====
            Row dateRow = sheet.createRow(rowIdx++);
            Cell dateCell = dateRow.createCell(0);
            LocalDateTime now = LocalDateTime.now();
            dateCell.setCellValue("Generated: " + now.format(DateTimeFormatter.ofPattern("dd MMMM yyyy HH:mm")));
            dateCell.setCellStyle(infoStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIdx - 2, rowIdx - 2, 0, Math.max(1, headers.size() - 1)));

            rowIdx++; // blank row

            // ===== REPORT TITLE =====
            Row reportTitleRow = sheet.createRow(rowIdx++);
            Cell reportTitleCell = reportTitleRow.createCell(0);
            reportTitleCell.setCellValue(title);
            reportTitleCell.setCellStyle(sectionFont != null ? titleStyle : infoStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIdx - 2, rowIdx - 2, 0, Math.max(1, headers.size() - 1)));

            // ===== META INFO =====
            Row metaRow = sheet.createRow(rowIdx++);
            Cell metaLabel1 = metaRow.createCell(0);
            metaLabel1.setCellValue("Report Type: " + title);
            metaLabel1.setCellStyle(metaLabelStyle);
            if (infoLines.size() > 1) {
                Cell metaLabel2 = metaRow.createCell(Math.min(2, headers.size() - 1));
                metaLabel2.setCellValue(infoLines.get(1));
                metaLabel2.setCellStyle(metaLabelStyle);
            }

            if (dateRange != null && !dateRange.isEmpty()) {
                Row drRow = sheet.createRow(rowIdx++);
                Cell drCell = drRow.createCell(0);
                drCell.setCellValue(dateRange);
                drCell.setCellStyle(infoStyle);
            }

            rowIdx++; // blank row

            // ===== TABLE HEADER =====
            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(22);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }

            // ===== DATA ROWS =====
            for (int r = 0; r < rows.size(); r++) {
                List<String> rowData = rows.get(r);
                Row dataRow = sheet.createRow(rowIdx++);
                boolean isAlt = r % 2 == 1;
                for (int i = 0; i < rowData.size(); i++) {
                    Cell cell = dataRow.createCell(i);
                    String val = rowData.get(i) != null ? rowData.get(i) : "";
                    cell.setCellValue(val);
                    if (i == 0) {
                        cell.setCellStyle(isAlt ? altRowCenterStyle : dataCenterStyle);
                    } else {
                        cell.setCellStyle(isAlt ? altRowStyle : dataStyle);
                    }
                }
            }

            rowIdx++; // blank row

            // ===== TOTAL ROW =====
            Row totalRow = sheet.createRow(rowIdx++);
            Cell totalLabel = totalRow.createCell(0);
            totalLabel.setCellValue("Total");
            totalLabel.setCellStyle(totalStyle);
            Cell totalValue = totalRow.createCell(1);
            totalValue.setCellValue(rows.size() + " records");
            totalValue.setCellStyle(totalStyle);

            rowIdx++; // blank row

            // ===== SUMMARY =====
            if (summary != null && !summary.isEmpty()) {
                Row summaryTitleRow = sheet.createRow(rowIdx++);
                Cell summaryTitleCell = summaryTitleRow.createCell(0);
                summaryTitleCell.setCellValue("SUMMARY");
                summaryTitleCell.setCellStyle(sectionFont != null ? titleStyle : infoStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIdx - 2, rowIdx - 2, 0, Math.max(1, headers.size() - 1)));

                for (Map.Entry<String, Long> entry : summary.entrySet()) {
                    Row sRow = sheet.createRow(rowIdx++);
                    Cell sLabel = sRow.createCell(0);
                    sLabel.setCellValue(entry.getKey());
                    sLabel.setCellStyle(summaryLabelStyle);
                    Cell sValue = sRow.createCell(1);
                    sValue.setCellValue(entry.getValue());
                    sValue.setCellStyle(summaryValueStyle);
                }
            }

            // ===== CALCULATE COLUMN WIDTHS =====
            for (int i = 0; i < headers.size(); i++) {
                // Start with header width
                int maxWidth = headers.get(i).length() + 4;

                // Check all data rows for this column
                for (List<String> rowData : rows) {
                    if (i < rowData.size() && rowData.get(i) != null) {
                        int len = rowData.get(i).length();
                        // Account for wrapped text (long emails, etc.)
                        if (len > 30) {
                            // For wrapped text, width is roughly longest word or 30 chars
                            String[] words = rowData.get(i).split("\\s+");
                            for (String word : words) {
                                maxWidth = Math.max(maxWidth, word.length() + 2);
                            }
                        }
                        maxWidth = Math.max(maxWidth, len + 2);
                    }
                }

                // Apply constraints
                maxWidth = Math.max(maxWidth, 8);   // minimum 8 chars
                maxWidth = Math.min(maxWidth, 50);   // maximum 50 chars

                // Convert to Excel width units (approx 256 per char)
                sheet.setColumnWidth(i, maxWidth * 256 + 512);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Excel report", e);
        }
    }
}
