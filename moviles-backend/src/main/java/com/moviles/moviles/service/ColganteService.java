package com.moviles.moviles.service;

import com.moviles.moviles.dto.ColganteRequestDTO;
import com.moviles.moviles.model.Colgante;
import com.moviles.moviles.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ColganteService {

    @Autowired
    private ColganteRepository colganteRepository;
    @Autowired
    private BrazoRepository brazoRepository;
    @Autowired
    private ObjetoRepository objetoRepository;
    @Autowired
    private HiloRepository hiloRepository;
    @Autowired
    private MovilRepository movilRepository;
    @Autowired
    private BrazoService brazoService;

    public List<Colgante> obtenerTodos() {
        return colganteRepository.findAll();
    }

    public Optional<Colgante> obtenerPorId(Long id) {
        return colganteRepository.findById(id);
    }

    public Colgante guardarDesdeDTO(ColganteRequestDTO dto) {
        Colgante colgante = new Colgante();

        // Resolver entidades desde IDs
        if (dto.getBrazoPadreId() != null)
            colgante.setBrazoPadre(brazoRepository.findById(dto.getBrazoPadreId()).orElseThrow());
        if (dto.getBrazoHijoId() != null)
            colgante.setBrazoHijo(brazoRepository.findById(dto.getBrazoHijoId()).orElseThrow());
        if (dto.getObjetoHijoId() != null)
            colgante.setObjetoHijo(objetoRepository.findById(dto.getObjetoHijoId()).orElseThrow());
        if (dto.getHiloId() != null)
            colgante.setHilo(hiloRepository.findById(dto.getHiloId()).orElseThrow());
        if (dto.getMovilPadreId() != null)
            colgante.setMovilPadre(movilRepository.findById(dto.getMovilPadreId()).orElseThrow());

        colgante.setLado(Colgante.Lado.valueOf(dto.getLado()));
        colgante.setDistanciaPivote(dto.getDistanciaPivote());

        // Reutilizar validaciones existentes
        return guardar(colgante);
    }

    public Colgante guardar(Colgante colgante) {
        if (colgante.getBrazoHijo() != null && colgante.getObjetoHijo() != null) {
            throw new IllegalArgumentException("Un colgante no puede tener brazoHijo y objetoHijo al mismo tiempo");
        }
        if (colgante.getBrazoHijo() == null && colgante.getObjetoHijo() == null) {
            throw new IllegalArgumentException("Un colgante debe tener brazoHijo u objetoHijo");
        }

        Long brazoPadreId = colgante.getBrazoPadre().getId();
        Long movilId = colgante.getMovilPadre().getId();
        List<Colgante> existentes = colganteRepository.findByBrazoPadreIdAndMovilPadreId(brazoPadreId, movilId);

        if (existentes.size() >= 2) {
            throw new IllegalArgumentException("Un brazo solo puede tener 2 colgantes por móvil");
        }

        boolean ladoYaExiste = existentes.stream()
            .anyMatch(c -> c.getLado() == colgante.getLado());
        if (ladoYaExiste) {
            throw new IllegalArgumentException("Ya existe un colgante en el lado " + colgante.getLado());
        }

        // NFZ: validar colisiones cuando ambos lados están presentes
        if (existentes.size() == 1) {
            List<Colgante> todos = new ArrayList<>(existentes);
            todos.add(colgante);
            brazoService.validarNFZ(colgante.getBrazoPadre(), todos);
        }

        return colganteRepository.save(colgante);
    }

    public void eliminar(Long id) {
        colganteRepository.deleteById(id);
    }

    public Colgante actualizarDesdeDTO(Long id, ColganteRequestDTO dto) {
        Colgante colgante = colganteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Colgante no encontrado: " + id));

        if (dto.getBrazoPadreId() != null)
            colgante.setBrazoPadre(brazoRepository.findById(dto.getBrazoPadreId()).orElseThrow());
        if (dto.getBrazoHijoId() != null)
            colgante.setBrazoHijo(brazoRepository.findById(dto.getBrazoHijoId()).orElseThrow());
        if (dto.getObjetoHijoId() != null)
            colgante.setObjetoHijo(objetoRepository.findById(dto.getObjetoHijoId()).orElseThrow());
        if (dto.getHiloId() != null)
            colgante.setHilo(hiloRepository.findById(dto.getHiloId()).orElseThrow());
        if (dto.getMovilPadreId() != null)
            colgante.setMovilPadre(movilRepository.findById(dto.getMovilPadreId()).orElseThrow());
        if (dto.getLado() != null)
            colgante.setLado(Colgante.Lado.valueOf(dto.getLado()));
        if (dto.getDistanciaPivote() != null)
            colgante.setDistanciaPivote(dto.getDistanciaPivote());

        return guardar(colgante);
    }

    public List<Colgante> obtenerPorBrazo(Long brazoId, Long movilId) {
        return colganteRepository.findByBrazoPadreIdAndMovilPadreId(brazoId, movilId);
    }
}