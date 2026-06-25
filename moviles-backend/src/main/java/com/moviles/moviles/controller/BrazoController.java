package com.moviles.moviles.controller;

import com.moviles.moviles.model.Brazo;
import com.moviles.moviles.service.BrazoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/brazos")
@CrossOrigin(origins = "http://localhost:5173")
public class BrazoController {

    @Autowired
    private BrazoService brazoService;

    @GetMapping
    public List<Brazo> obtenerTodos() {
        return brazoService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Brazo> obtenerPorId(@PathVariable Long id) {
        return brazoService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Brazo crear(@RequestBody Brazo brazo) {
        return brazoService.guardar(brazo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Brazo> actualizar(@PathVariable Long id, @RequestBody Brazo brazo) {
        return brazoService.obtenerPorId(id).map(b -> {
            brazo.setId(id);
            return ResponseEntity.ok(brazoService.guardar(brazo));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        brazoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/peso-total")
    public ResponseEntity<Double> pesoTotal(@PathVariable Long id) {
        return ResponseEntity.ok(brazoService.calcularPesoTotal(id));
    }

    // ── NUEVO ──────────────────────────────────────────────────────────────
    @GetMapping("/sugerir-minimo")
    public ResponseEntity<Map<String, Object>> sugerirMinimo(
            @RequestParam Long obj1Id,
            @RequestParam Long obj2Id) {
        return ResponseEntity.ok(brazoService.sugerirBrazoMinimo(obj1Id, obj2Id));
    }
}