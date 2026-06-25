package com.moviles.moviles.controller;

import com.moviles.moviles.dto.MovilDetalleDTO;
import com.moviles.moviles.model.Movil;
import com.moviles.moviles.service.MovilService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/moviles")
public class MovilController {

    @Autowired
    private MovilService movilService;

    @GetMapping
    public List<Movil> obtenerTodos() {
        return movilService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movil> obtenerPorId(@PathVariable Long id) {
        return movilService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Movil crear(@RequestBody Movil movil) {
        return movilService.guardar(movil);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Movil> actualizar(@PathVariable Long id, @RequestBody Movil movil) {
        return movilService.obtenerPorId(id).map(m -> {
            movil.setId(id);
            return ResponseEntity.ok(movilService.guardar(movil));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        movilService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/detalle")
    public ResponseEntity<MovilDetalleDTO> obtenerDetalle(@PathVariable Long id) {
        return ResponseEntity.ok(movilService.obtenerDetalle(id));
    }
}