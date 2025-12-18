package com.robertforpresent.api.catalog.domain.model;

import java.util.UUID;

public record GameIdentity(UUID id,
                           String name,
                           String slug) {

}
