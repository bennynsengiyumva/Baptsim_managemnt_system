package com.church.baptism.service.church;

import com.church.baptism.dto.request.ChurchRequest;
import com.church.baptism.dto.response.ChurchDetailResponse;
import com.church.baptism.dto.response.ChurchResponse;

import java.time.LocalDate;
import java.util.List;

public interface ChurchService {

    ChurchResponse createChurch(ChurchRequest request);

    List<ChurchResponse> getAllChurches();

    ChurchResponse getChurchById(Long id);

    ChurchResponse updateChurch(
            Long id,
            ChurchRequest request
    );

    ChurchResponse assignPastorToChurch(
            Long churchId,
            Long pastorId
    );

    ChurchResponse unassignPastor(Long churchId);

    void deleteChurch(Long id);

    List<ChurchResponse> getChurchesByDistrict(Long districtId);

    ChurchDetailResponse getChurchDetail(Long churchId, LocalDate dateFrom, LocalDate dateTo);
}