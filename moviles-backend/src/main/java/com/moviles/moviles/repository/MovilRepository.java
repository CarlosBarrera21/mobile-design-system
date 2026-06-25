package com.moviles.moviles.repository;

import com.moviles.moviles.model.Movil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovilRepository extends JpaRepository<Movil, Long> {}