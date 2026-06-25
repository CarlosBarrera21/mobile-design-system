package com.moviles.moviles.dto;

import com.moviles.moviles.model.Colgante;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class MovilDetalleDTO {
    private Long id;
    private String nombre;
    private Double posX;
    private Double posY;
    private List<Colgante> colgantes;
}