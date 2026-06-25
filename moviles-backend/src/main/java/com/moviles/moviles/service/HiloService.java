package com.moviles.moviles.service;

import com.moviles.moviles.model.Hilo;
import com.moviles.moviles.repository.HiloRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class HiloService {

    @Autowired
    private HiloRepository hiloRepository;

    public List<Hilo> obtenerTodos() {
        return hiloRepository.findAll();
    }

    public Optional<Hilo> obtenerPorId(Long id) {
        return hiloRepository.findById(id);
    }

    public Hilo guardar(Hilo hilo) {
        if (hilo.getLargo() == null || hilo.getLargo() <= 0) {
            throw new IllegalArgumentException("El largo del hilo debe ser mayor a 0");
        }
        // Positivo + redondear siempre hacia arriba
        double largoFinal = Math.ceil(Math.abs(hilo.getLargo()));
        hilo.setLargo(largoFinal);
        return hiloRepository.save(hilo);
    }

    public void eliminar(Long id) {
        hiloRepository.deleteById(id);
    }
}