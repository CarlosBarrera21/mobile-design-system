package com.moviles.moviles.repository;

import com.moviles.moviles.model.Hilo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HiloRepository extends JpaRepository<Hilo, Long> {}