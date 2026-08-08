package com.meet2be.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Base URLs used to build campaign tracking links. apiBaseUrl must be reachable
 * by the recipient's mail client (it serves the open pixel and click redirect);
 * appBaseUrl is where the click redirect sends them (the join page).
 */
@Getter
@Component
public class CampaignLinksProperties {

    private final String apiBaseUrl;
    private final String appBaseUrl;

    public CampaignLinksProperties(
            @Value("${meet2be.public.api-base-url}") String apiBaseUrl,
            @Value("${meet2be.public.app-base-url}") String appBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.appBaseUrl = appBaseUrl;
    }
}
