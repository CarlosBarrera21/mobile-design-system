package com.moviles.moviles.controller;

import com.moviles.moviles.model.Objeto;
import com.moviles.moviles.service.ObjetoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/objetos")
@CrossOrigin(origins = "http://localhost:5173")
public class ObjetoController {

    @Autowired
    private ObjetoService objetoService;

    @GetMapping
    public List<Objeto> obtenerTodos() {
        return objetoService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Objeto> obtenerPorId(@PathVariable Long id) {
        return objetoService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Objeto crear(@RequestBody Objeto objeto) {
        return objetoService.guardar(objeto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Objeto> actualizar(@PathVariable Long id, @RequestBody Objeto objeto) {
        return objetoService.obtenerPorId(id).map(o -> {
            objeto.setId(id);
            return ResponseEntity.ok(objetoService.guardar(objeto));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        objetoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}