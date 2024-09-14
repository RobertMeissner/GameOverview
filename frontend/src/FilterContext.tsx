// FilterContext.tsx
import React, { createContext, useContext, useState } from 'react';

// Define the type of your data
export interface FilterContextType {
    playedFilter: boolean;
    hideFilter: boolean;
    ratingRange: number[];
    reviewScoreRange: number[];
    setPlayedFilter: (value: boolean | ((prev: boolean) => boolean)) => void; // Updated type
    setHideFilter: (value: boolean | ((prev: boolean) => boolean)) => void; // Updated type
    setRatingRange: (range: number[]) => void;
    setReviewScoreRange: (range: number[]) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode; }> = ({ children }) => {
    const [playedFilter, setPlayedFilter] = useState(false);
    const [hideFilter, setHideFilter] = useState(false);
    const [ratingRange, setRatingRange] = useState<number[]>([0.8, 1]);
    const [reviewScoreRange, setReviewScoreRange] = useState<number[]>([7, 9]);

    return (
        <FilterContext.Provider value={{
            playedFilter, hideFilter, ratingRange, reviewScoreRange,
            setPlayedFilter, setHideFilter, setRatingRange, setReviewScoreRange
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilterContext = (): FilterContextType => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error("useFilterContext must be used within a FilterProvider");
    }
    return context;
};
