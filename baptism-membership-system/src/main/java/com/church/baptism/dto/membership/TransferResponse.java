package com.church.baptism.dto.membership;

public class TransferResponse {
    public Long id;
    public Long memberId;
    public String memberName;
    public Long fromChurchId;
    public String fromChurchName;
    public Long toChurchId;
    public String toChurchName;
    public String reason;
    public String status;
    public String initiatorType;
    public String requestedBy;
    public String approvedByFromChurch;
    public String approvedByToChurch;
}
