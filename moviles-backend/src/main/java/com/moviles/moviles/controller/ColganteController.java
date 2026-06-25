package com.moviles.moviles.controller;

import com.moviles.moviles.dto.ColganteRequestDTO;
import com.moviles.moviles.model.Colgante;
import com.moviles.moviles.service.ColganteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/colgantes")
@CrossOrigin(origins = "http://localhost:5173")
public class ColganteController {

    @Autowired
    private ColganteService colganteService;

    @GetMapping
    public List<Colgante> obtenerTodos() {
        return colganteService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Colgante> obtenerPorId(@PathVariable Long id) {
        return colganteService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ColganteRequestDTO dto) {
        try {
            return ResponseEntity.ok(colganteService.guardarDesdeDTO(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Colgante> actualizar(@PathVariable Long id, @RequestBody ColganteRequestDTO dto) {
        return ResponseEntity.ok(colganteService.actualizarDesdeDTO(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        colganteService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/brazo/{brazoId}")
    public List<Colgante> obtenerPorBrazo(
        @PathVariable Long brazoId,
        @RequestParam Long movilId) {
        return colganteService.obtenerPorBrazo(brazoId, movilId);
    }
}
