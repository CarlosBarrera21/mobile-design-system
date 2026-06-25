package com.moviles.moviles.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "brazo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder                          // ✅ agregar esto
@JsonIgnoreProperties({"colgantes", "hibernateLazyInitializer", "handler", "fieldHandler"})
public class Brazo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Column(nullable = true)      // ✅ nullable true para evitar errores si llega null
    private Double peso;

    @Column(columnDefinition = "DECIMAL(10,4)")
    private Double longitud;

    @Column(name = "pos_x", columnDefinition = "DECIMAL(10,4)")
    private Double posX;

    @Column(name = "pos_y", columnDefinition = "DECIMAL(10,4)")
    private Double posY;

    @JsonIgnore
    @OneToMany(mappedBy = "brazoPadre", cascade = CascadeType.ALL)
    private List<Colgante> colgantes;
}