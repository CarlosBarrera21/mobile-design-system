package com.moviles.moviles.repository;

import com.moviles.moviles.model.Colgante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ColganteRepository extends JpaRepository<Colgante, Long> {

    List<Colgante> findByBrazoPadreIdAndMovilPadreId(Long brazoPadreId, Long movilPadreId);

    // Método anterior (se puede dejar para otros usos)
    List<Colgante> findByMovilPadreId(Long movilPadreId);

    // ← NUEVO: carga todas las relaciones en una sola query
    @Query("SELECT c FROM Colgante c " +
           "LEFT JOIN FETCH c.objetoHijo " +
           "LEFT JOIN FETCH c.brazoHijo " +
           "LEFT JOIN FETCH c.hilo " +
           "LEFT JOIN FETCH c.brazoPadre " +
           "WHERE c.movilPadre.id = :movilId")
    List<Colgante> findByMovilPadreIdConRelaciones(@Param("movilId") Long movilId);

    // Agregar este método junto a los otros
    List<Colgante> findByBrazoPadreId(Long brazoPadreId);
}