package com.moviles.moviles.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "colgante")
@Data @NoArgsConstructor @AllArgsConstructor
public class Colgante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "movil_padre_id")
    private Movil movilPadre;

    @ManyToOne
    @JoinColumn(name = "brazo_padre_id")
    private Brazo brazoPadre;

    @ManyToOne
    @JoinColumn(name = "brazo_hijo_id")
    @JsonIgnoreProperties("colgantes")
    private Brazo brazoHijo;

    @ManyToOne
    @JoinColumn(name = "objeto_hijo_id")
    private Objeto objetoHijo;

    @ManyToOne
    @JoinColumn(name = "hilo_id")
    private Hilo hilo;

    @Enumerated(EnumType.STRING)
    private Lado lado;

    @Column(name = "distancia_pivote", columnDefinition = "DECIMAL(10,4)")
    private Double distanciaPivote;

    public enum Lado {
        izquierdo, derecho   // ✅ mayúsculas — estándar Java
    }
}