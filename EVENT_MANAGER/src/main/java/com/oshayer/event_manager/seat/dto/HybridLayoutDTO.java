package com.oshayer.event_manager.seat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HybridLayoutDTO {

    private CanvasSpec canvas;

    @Builder.Default
    private List<SectionDefinition> sections = new ArrayList<>();

    @Builder.Default
    private List<ElementDefinition> elements = new ArrayList<>();

    @Builder.Default
    private List<SeatDefinition> seats = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CanvasSpec {
        private Double width;
        private Double height;
        private Double gridSize;
        private Double zoom;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionDefinition {
        @Builder.Default
        private UUID id = UUID.randomUUID();
        private String label;
        private String shape;
        private Double x;
        private Double y;
        private Double width;
        private Double height;
        private Double radius;
        private Double rotation;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ElementDefinition {
        @Builder.Default
        private UUID id = UUID.randomUUID();
        private String type;
        private String label;
        private Double x;
        private Double y;
        private Double width;
        private Double height;
        private Double radius;
        private Double rotation;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatDefinition {
        @Builder.Default
        private UUID id = UUID.randomUUID();
        private UUID sectionId;
        private String label;
        private String rowLabel;
        private Integer number;
        private String tierCode;
        private String type;
        private Double x;
        private Double y;
        private Double rotation;
        private Double radius;
    }
}
