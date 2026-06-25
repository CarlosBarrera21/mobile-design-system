package com.moviles.moviles.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hilo")
@Data @NoArgsConstructor @AllArgsConstructor
public class Hilo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "DECIMAL(10,4)")
    private Double largo;
}