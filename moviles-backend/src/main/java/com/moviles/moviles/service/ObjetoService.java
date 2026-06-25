package com.moviles.moviles.service;

import com.moviles.moviles.model.Objeto;
import com.moviles.moviles.repository.ObjetoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ObjetoService {

    @Autowired
    private ObjetoRepository objetoRepository;

    public List<Objeto> obtenerTodos() {
        return objetoRepository.findAll();
    }

    public Optional<Objeto> obtenerPorId(Long id) {
        return objetoRepository.findById(id);
    }

    public Objeto guardar(Objeto objeto) {
        return objetoRepository.save(objeto);
    }

    public void eliminar(Long id) {
        objetoRepository.deleteById(id);
    }
}