package com.ekap.hrservice.service;

import org.springframework.stereotype.Service;

@Service
public class SensitivityService {

    private final ToneConfigService toneConfigService;

    public SensitivityService(ToneConfigService toneConfigService) {
        this.toneConfigService = toneConfigService;
    }

    public String getSensitivityLevel(String subVertical) {
        return toneConfigService.getSensitivityLevel(subVertical);
    }

    public boolean requiresEscalation(String subVertical) {
        return toneConfigService.requiresEscalation(subVertical);
    }
}
