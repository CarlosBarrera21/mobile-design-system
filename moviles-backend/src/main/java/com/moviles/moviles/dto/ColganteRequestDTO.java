package com.moviles.moviles.dto;

import lombok.Data;

@Data
public class ColganteRequestDTO {
    private Long brazoPadreId;
    private Long brazoHijoId;
    private Long objetoHijoId;
    private Long hiloId;
    private Long movilPadreId;
    private String lado;
    private Double distanciaPivote;
}