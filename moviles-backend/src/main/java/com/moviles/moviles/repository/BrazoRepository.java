package com.moviles.moviles.repository;

import com.moviles.moviles.model.Brazo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BrazoRepository extends JpaRepository<Brazo, Long> {}