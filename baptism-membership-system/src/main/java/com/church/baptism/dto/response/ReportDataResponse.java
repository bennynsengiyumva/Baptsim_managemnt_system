package com.church.baptism.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ReportDataResponse {

    public String reportName;
    public String generatedBy;
    public String generatedByName;
    public LocalDateTime generationDate;
    public Map<String, String> filters;
    public Map<String, Object> summary;
    public List<Map<String, Object>> records;
    public List<String> columnHeaders;
    public Integer totalRecords;
}
