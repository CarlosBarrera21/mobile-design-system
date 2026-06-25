package com.moviles.moviles.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "objeto")
@Data @NoArgsConstructor @AllArgsConstructor
public class Objeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Column(columnDefinition = "LONGTEXT")
    private String imagenBase64;    

    @Column(columnDefinition = "DECIMAL(10,4)")
    private Double largo;

    @Column(columnDefinition = "DECIMAL(10,4)")
    private Double ancho;

    @Column(columnDefinition = "DECIMAL(10,4)")
    private Double peso;

    @Column(name = "pos_x", columnDefinition = "DECIMAL(10,4)")
    private Double posX;

    @Column(name = "pos_y", columnDefinition = "DECIMAL(10,4)")
    private Double posY;

    @Column(name = "radio_colision", columnDefinition = "DECIMAL(10,4)")
    private Double radioColision;
}