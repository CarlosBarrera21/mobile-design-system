package com.moviles.moviles.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "movil")
@Data @NoArgsConstructor @AllArgsConstructor
public class Movil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Column(name = "pos_x", columnDefinition = "DECIMAL(10,4)")
    private Double posX;

    @Column(name = "pos_y", columnDefinition = "DECIMAL(10,4)")
    private Double posY;

    @JsonIgnore
    @OneToMany(mappedBy = "movilPadre", cascade = CascadeType.ALL)
    private List<Colgante> colgantes;
}