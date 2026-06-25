package com.moviles.moviles.service;

import com.moviles.moviles.dto.MovilDetalleDTO;
import com.moviles.moviles.model.Colgante;
import com.moviles.moviles.model.Movil;
import com.moviles.moviles.repository.MovilRepository;
import com.moviles.moviles.repository.ColganteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;  // ← NUEVO
import java.util.List;
import java.util.Optional;

@Service
public class MovilService {

    @Autowired
    private MovilRepository movilRepository;

    @Autowired
    private ColganteRepository colganteRepository;

    public List<Movil> obtenerTodos() {
        return movilRepository.findAll();
    }

    public Optional<Movil> obtenerPorId(Long id) {
        return movilRepository.findById(id);
    }

    public Movil guardar(Movil movil) {
        return movilRepository.save(movil);
    }

    public void eliminar(Long id) {
        movilRepository.deleteById(id);
    }

    @Transactional  // ← NUEVO
    public MovilDetalleDTO obtenerDetalle(Long id) {
        Movil movil = movilRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Móvil no encontrado: " + id));

        // ← CAMBIADO: usa JOIN FETCH para cargar objetoHijo con imagenBase64
        List<Colgante> colgantes = colganteRepository.findByMovilPadreIdConRelaciones(id);

        return new MovilDetalleDTO(
            movil.getId(),
            movil.getNombre(),
            movil.getPosX(),
            movil.getPosY(),
            colgantes
        );
    }
}