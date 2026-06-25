package com.church.baptism.dto.membership;

public class TransferAnalyticsDTO {

    private long totalTransfers;
    private long pendingTransfers;
    private long approvedTransfers;
    private long completedTransfers;
    private long rejectedTransfers;

    public TransferAnalyticsDTO() {
    }

    public TransferAnalyticsDTO(
            long totalTransfers,
            long pendingTransfers,
            long approvedTransfers,
            long completedTransfers,
            long rejectedTransfers
    ) {
        this.totalTransfers = totalTransfers;
        this.pendingTransfers = pendingTransfers;
        this.approvedTransfers = approvedTransfers;
        this.completedTransfers = completedTransfers;
        this.rejectedTransfers = rejectedTransfers;
    }

    public long getTotalTransfers() {
        return totalTransfers;
    }

    public void setTotalTransfers(long totalTransfers) {
        this.totalTransfers = totalTransfers;
    }

    public long getPendingTransfers() {
        return pendingTransfers;
    }

    public void setPendingTransfers(long pendingTransfers) {
        this.pendingTransfers = pendingTransfers;
    }

    public long getApprovedTransfers() {
        return approvedTransfers;
    }

    public void setApprovedTransfers(long approvedTransfers) {
        this.approvedTransfers = approvedTransfers;
    }

    public long getCompletedTransfers() {
        return completedTransfers;
    }

    public void setCompletedTransfers(long completedTransfers) {
        this.completedTransfers = completedTransfers;
    }

    public long getRejectedTransfers() {
        return rejectedTransfers;
    }

    public void setRejectedTransfers(long rejectedTransfers) {
        this.rejectedTransfers = rejectedTransfers;
    }
}