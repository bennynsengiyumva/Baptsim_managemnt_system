package com.church.baptism.service.report;

import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@Service
public class ReportPdfService {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
    private static final Font INFO_FONT = FontFactory.getFont(FontFactory.HELVETICA, 11, BaseColor.BLACK);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
    private static final Font CELL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.BLACK);
    private static final Font SUMMARY_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.BLACK);

    private static final BaseColor HEADER_BG = new BaseColor(70, 130, 180);

    public byte[] generateReport(
            String title,
            List<String> infoLines,
            String dateRange,
            List<String> headers,
            List<List<String>> rows,
            Map<String, Long> summary
    ) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 30);
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph titlePara = new Paragraph(title, TITLE_FONT);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            titlePara.setSpacingAfter(10);
            document.add(titlePara);

            for (String line : infoLines) {
                Paragraph p = new Paragraph(line, INFO_FONT);
                p.setSpacingAfter(2);
                document.add(p);
            }

            if (dateRange != null && !dateRange.isEmpty()) {
                Paragraph datePara = new Paragraph(dateRange, INFO_FONT);
                datePara.setSpacingAfter(10);
                document.add(datePara);
            } else {
                document.add(new Paragraph(" "));
            }

            PdfPTable table = new PdfPTable(headers.size());
            table.setWidthPercentage(100);

            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, HEADER_FONT));
                cell.setBackgroundColor(HEADER_BG);
                cell.setPadding(5);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            for (List<String> row : rows) {
                for (String cellValue : row) {
                    PdfPCell cell = new PdfPCell(new Phrase(cellValue != null ? cellValue : "", CELL_FONT));
                    cell.setPadding(4);
                    table.addCell(cell);
                }
            }

            document.add(table);

            document.add(new Paragraph(" "));

            Paragraph summaryTitle = new Paragraph("Summary", SUMMARY_FONT);
            summaryTitle.setSpacingAfter(4);
            document.add(summaryTitle);

            for (Map.Entry<String, Long> entry : summary.entrySet()) {
                Paragraph p = new Paragraph(entry.getKey() + ": " + entry.getValue(), INFO_FONT);
                p.setSpacingAfter(1);
                document.add(p);
            }

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF report", e);
        }
    }
}
