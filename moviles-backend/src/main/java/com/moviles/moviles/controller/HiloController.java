package com.moviles.moviles.controller;

import com.moviles.moviles.model.Hilo;
import com.moviles.moviles.service.HiloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/hilos")
@CrossOrigin(origins = "http://localhost:5173")
public class HiloController {

    @Autowired
    private HiloService hiloService;

    @GetMapping
    public List<Hilo> obtenerTodos() {
        return hiloService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hilo> obtenerPorId(@PathVariable Long id) {
        return hiloService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Hilo crear(@RequestBody Hilo hilo) {
        return hiloService.guardar(hilo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        hiloService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}