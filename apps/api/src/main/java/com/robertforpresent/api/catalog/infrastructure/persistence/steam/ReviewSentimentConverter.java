package com.robertforpresent.api.catalog.infrastructure.persistence.steam;

import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class ReviewSentimentConverter implements AttributeConverter<ReviewSentiment, String> {

    @Override
    public String convertToDatabaseColumn(ReviewSentiment sentiment) {
        if (sentiment == null) {
            return null;
        }
        return sentiment.displayName();
    }

    @Override
    public ReviewSentiment convertToEntityAttribute(String dbValue) {
        if (dbValue == null || dbValue.isBlank()) {
            return ReviewSentiment.UNDEFINED;
        }
        return ReviewSentiment.fromDisplayName(dbValue);
    }
}
