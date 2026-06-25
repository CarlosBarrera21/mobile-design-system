package com.moviles.moviles.service;

import com.moviles.moviles.model.Brazo;
import com.moviles.moviles.model.Colgante;
import com.moviles.moviles.model.Hilo;
import com.moviles.moviles.model.Objeto;
import com.moviles.moviles.repository.BrazoRepository;
import com.moviles.moviles.repository.ColganteRepository;
import com.moviles.moviles.repository.ObjetoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class BrazoService {

    private static final double MARGEN_NFZ = 1.0;
    private static final List<Double> FIBONACCI = List.of(7.0, 11.0, 18.0, 29.0, 47.0, 76.0, 123.0);

    @Autowired private BrazoRepository brazoRepository;
    @Autowired private ColganteRepository colganteRepository;
    @Autowired private ObjetoRepository objetoRepository;

    public List<Brazo> obtenerTodos() {
        return brazoRepository.findAll();
    }

    public Optional<Brazo> obtenerPorId(Long id) {
        return brazoRepository.findById(id);
    }

    public Brazo guardar(Brazo brazo) {
        // Validar que la longitud sea Fibonacci
        if (brazo.getLongitud() != null) {
            double L = brazo.getLongitud();
            boolean esFibonacci = FIBONACCI.stream().anyMatch(f -> Math.abs(f - L) < 0.001);
            if (!esFibonacci) {
                throw new IllegalArgumentException(
                    "La longitud del brazo (" + L + "cm) no es válida. " +
                    "Usa una longitud Fibonacci: " + FIBONACCI + "cm.");
            }
            brazo.setPeso(L);
        }
        return brazoRepository.save(brazo);
    }

    public void eliminar(Long id) {
        brazoRepository.deleteById(id);
    }

    // Peso total recursivo: brazo + todo lo que cuelga de él
    public double calcularPesoTotal(Long brazoId) {
        Brazo brazo = brazoRepository.findById(brazoId)
            .orElseThrow(() -> new RuntimeException("Brazo no encontrado: " + brazoId));

        double peso = brazo.getPeso() != null ? brazo.getPeso() : 0.0;

        List<Colgante> colgantes = colganteRepository.findByBrazoPadreId(brazoId);
        for (Colgante c : colgantes) {
            if (c.getObjetoHijo() != null) {
                peso += c.getObjetoHijo().getPeso() != null ? c.getObjetoHijo().getPeso() : 0.0;
            } else if (c.getBrazoHijo() != null) {
                peso += calcularPesoTotal(c.getBrazoHijo().getId());
            }
        }
        return peso;
    }

    // ── NFZ: validación de colisiones ─────────────────────────────────────────
    // Lanza IllegalArgumentException si hay colisión horizontal o vertical.

    public void validarNFZ(Brazo brazoPadre, List<Colgante> colgantes) {
        if (colgantes.size() < 2) { System.out.println("[NFZ] <2 colgantes, skip"); return; }

        Colgante izq = colgantes.stream()
            .filter(c -> c.getLado() == Colgante.Lado.izquierdo)
            .findFirst().orElse(null);
        Colgante der = colgantes.stream()
            .filter(c -> c.getLado() == Colgante.Lado.derecho)
            .findFirst().orElse(null);
        if (izq == null || der == null) { System.out.println("[NFZ] missing side, skip"); return; }

        double L = brazoPadre.getLongitud() != null ? brazoPadre.getLongitud() : 0;
        System.out.println("[NFZ] Brazo " + brazoPadre.getId() + " L=" + L);

        // Cargar todos los colgantes del móvil para evitar queries recursivas lentas
        Long movilId = colgantes.stream()
            .filter(c -> c.getMovilPadre() != null && c.getMovilPadre().getId() != null)
            .map(c -> c.getMovilPadre().getId()).findFirst().orElse(null);
        List<Colgante> allColgantes = new ArrayList<>(colgantes);
        if (movilId != null) {
            allColgantes.addAll(colganteRepository.findByMovilPadreIdConRelaciones(movilId));
        }
        System.out.println("[NFZ] allColgantes size=" + allColgantes.size() + " (movilId=" + movilId + ")");

        // ── Validación horizontal ──────────────────────────────────────────
        double alcanceIzq = calcularAlcanceHaciaElCentro(izq, allColgantes, Colgante.Lado.derecho);
        double alcanceDer = calcularAlcanceHaciaElCentro(der, allColgantes, Colgante.Lado.izquierdo);
        double minLHorizontal = alcanceIzq + alcanceDer;
        System.out.println("[NFZ] Horizontal: alcanceIzq=" + alcanceIzq + " alcanceDer=" + alcanceDer + " minL=" + minLHorizontal + " vs L=" + L);

        if (L + 0.001 < minLHorizontal) {
            System.out.println("[NFZ] COLISION HORIZONTAL detectada!");
            throw new IllegalArgumentException(String.format(
                "Colisión horizontal: el brazo (%.1fcm) es menor al mínimo necesario (%.1fcm). " +
                "Usa un brazo más largo o reduce el ancho de los objetos.",
                L, Math.ceil(minLHorizontal)));
        }

        // ── Validación vertical ────────────────────────────────────────────
        for (Colgante c : colgantes) {
            double hiloLargo = c.getHilo() != null && c.getHilo().getLargo() != null
                ? c.getHilo().getLargo() : 0;
            System.out.println("[NFZ] Vertical lado=" + c.getLado() + " hilo=" + hiloLargo);

            if (c.getObjetoHijo() != null) {
                double minHilo = Math.max(MARGEN_NFZ, c.getObjetoHijo().getLargo() * 0.3);
                System.out.println("[NFZ]  objeto=" + c.getObjetoHijo().getNombre() + " minHilo=" + minHilo);
                if (hiloLargo < minHilo - 0.001) {
                    throw new IllegalArgumentException(String.format(
                        "Colisión vertical: el hilo %s (%.1fcm) es muy corto para el objeto '%s' (largo %.1fcm). " +
                        "Mínimo: %.1fcm.",
                        c.getLado(), hiloLargo, c.getObjetoHijo().getNombre(),
                        c.getObjetoHijo().getLargo(), Math.ceil(minHilo)));
                }
            } else if (c.getBrazoHijo() != null) {
                double profMax = calcularProfundidadMax(c.getBrazoHijo().getId());
                double minHilo = Math.max(MARGEN_NFZ, profMax + MARGEN_NFZ);
                if (hiloLargo < minHilo - 0.001) {
                    throw new IllegalArgumentException(String.format(
                        "Colisión vertical: el hilo %s (%.1fcm) no cubre la profundidad del sub-árbol (%.1fcm). " +
                        "Mínimo: %.1fcm.",
                        c.getLado(), hiloLargo, profMax, Math.ceil(minHilo)));
                }
            }
        }
    }

    // Alcance horizontal de un colgante hacia el centro del brazo
    // ladoOpuesto = el lado hacia el que se mide (derecho para colgante izquierdo, izquierdo para colgante derecho)
    private double calcularAlcanceHaciaElCentro(Colgante colgante, List<Colgante> allColgantes, Colgante.Lado ladoOpuesto) {
        if (colgante.getObjetoHijo() != null) {
            return (colgante.getObjetoHijo().getAncho() / 2.0) + MARGEN_NFZ;
        }
        if (colgante.getBrazoHijo() != null) {
            return calcularAlcanceBrazo(colgante.getBrazoHijo().getId(), allColgantes, ladoOpuesto);
        }
        return 0;
    }

    // Alcance máximo de un brazo (sub-árbol) desde su centro hacia un lado
    private double calcularAlcanceBrazo(Long brazoId, List<Colgante> allColgantes, Colgante.Lado lado) {
        List<Colgante> cols = allColgantes.stream()
            .filter(c -> c.getBrazoPadre() != null && brazoId.equals(c.getBrazoPadre().getId()))
            .toList();
        boolean fromDB = false;
        // Si no está en la lista pasada, buscar en BD (sub-árbol anidado no incluido)
        if (cols.isEmpty()) {
            cols = colganteRepository.findByBrazoPadreId(brazoId);
            fromDB = true;
        }
        if (cols.isEmpty()) { System.out.println("[ALCANCE] brazo " + brazoId + " sin colgantes → 0"); return 0; }

        double brazoLong = cols.get(0).getBrazoPadre().getLongitud() != null
            ? cols.get(0).getBrazoPadre().getLongitud() : 0;
        double reach = brazoLong / 2.0;
        System.out.println("[ALCANCE] brazo " + brazoId + " lado=" + lado + " L=" + brazoLong + " baseReach=" + reach + " fromDB=" + fromDB + " cols=" + cols.size());

        for (Colgante c : cols) {
            if (c.getLado() == lado) {
                double dp = c.getDistanciaPivote() != null ? c.getDistanciaPivote() : 0;
                if (c.getObjetoHijo() != null) {
                    double itemReach = dp + (c.getObjetoHijo().getAncho() / 2.0) + MARGEN_NFZ;
                    System.out.println("[ALCANCE]  objeto " + c.getObjetoHijo().getNombre() + " dp=" + dp + " ancho=" + c.getObjetoHijo().getAncho() + " reach=" + itemReach);
                    reach = Math.max(reach, itemReach);
                } else if (c.getBrazoHijo() != null) {
                    double subReach = calcularAlcanceBrazo(c.getBrazoHijo().getId(), allColgantes, lado);
                    double itemReach = dp + subReach;
                    System.out.println("[ALCANCE]  sub-brazo " + c.getBrazoHijo().getId() + " dp=" + dp + " subReach=" + subReach + " total=" + itemReach);
                    reach = Math.max(reach, itemReach);
                }
            }
        }
        System.out.println("[ALCANCE] brazo " + brazoId + " → return " + reach);
        return reach;
    }

    // Profundidad máxima vertical de un sub-árbol (suma de hilos + objetos)
    private double calcularProfundidadMax(Long brazoId) {
        Brazo brazo = brazoRepository.findById(brazoId).orElse(null);
        if (brazo == null) return 0;

        List<Colgante> colgantes = colganteRepository.findByBrazoPadreId(brazoId);
        double maxProf = 0;

        for (Colgante c : colgantes) {
            double hiloLargo = c.getHilo() != null && c.getHilo().getLargo() != null
                ? c.getHilo().getLargo() : 0;

            if (c.getObjetoHijo() != null) {
                double objLargo = c.getObjetoHijo().getLargo() != null ? c.getObjetoHijo().getLargo() : 0;
                maxProf = Math.max(maxProf, hiloLargo + objLargo);
            } else if (c.getBrazoHijo() != null) {
                double subProf = calcularProfundidadMax(c.getBrazoHijo().getId());
                maxProf = Math.max(maxProf, hiloLargo + subProf);
            }
        }
        return maxProf;
    }

    // ── NUEVO: sugerir brazo mínimo para 2 objetos ──────────────────────────
    // radio = (ancho / 2) + 1
    // Con peso del brazo incluido: peso = L (convención cm = g)
    //   D1 = L*(W2 + L/2)/(W1 + W2 + L)   distancia del objeto 1 al pivote
    //   D2 = L*(W1 + L/2)/(W1 + W2 + L)   distancia del objeto 2 al pivote
    // Restricción: D1 >= r1, D2 >= r2  →  L mínimo por cuadrática:
    //   L >= r1 - W2 + sqrt((W2-r1)² + 2*r1*(W1+W2))
    //   L >= r2 - W1 + sqrt((W1-r2)² + 2*r2*(W1+W2))
    public Map<String, Object> sugerirBrazoMinimo(Long obj1Id, Long obj2Id) {
        Objeto o1 = objetoRepository.findById(obj1Id)
            .orElseThrow(() -> new RuntimeException("Objeto no encontrado: " + obj1Id));
        Objeto o2 = objetoRepository.findById(obj2Id)
            .orElseThrow(() -> new RuntimeException("Objeto no encontrado: " + obj2Id));

        double w1 = Math.max(o1.getPeso(), 0.001);
        double w2 = Math.max(o2.getPeso(), 0.001);
        double r1 = (o1.getAncho() / 2.0) + 1.0;
        double r2 = (o2.getAncho() / 2.0) + 1.0;

        // Mínimo por cada restricción incluyendo peso del brazo (W = L)
        // Discriminante siempre >= (W2-r1)² → raíz real asegurada
        double sqrt1 = Math.sqrt(Math.pow(w2 - r1, 2) + 2.0 * r1 * (w1 + w2));
        double sqrt2 = Math.sqrt(Math.pow(w1 - r2, 2) + 2.0 * r2 * (w1 + w2));
        double lMin1 = r1 - w2 + sqrt1;
        double lMin2 = r2 - w1 + sqrt2;
        double lMin = Math.max(Math.max(lMin1, lMin2), 1.0);

        // Distancias con peso del brazo incluido
        double W = lMin;
        double d1 = lMin * (w2 + W / 2.0) / (w1 + w2 + W);
        double d2 = lMin - d1;

        // Buscar brazos disponibles con longitud >= lMin
        final double minL = lMin;
        List<Brazo> brazosDisponibles = brazoRepository.findAll().stream()
            .filter(b -> b.getLongitud() != null && b.getLongitud() >= minL)
            .sorted(Comparator.comparingDouble(Brazo::getLongitud))
            .toList();

        // El más pesado va a la izquierda
        boolean obj1Izquierdo = w1 >= w2;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("longitudMinima", Math.ceil(lMin));
        result.put("distanciaObj1", Math.round(d1 * 10000.0) / 10000.0);
        result.put("distanciaObj2", Math.round(d2 * 10000.0) / 10000.0);
        result.put("obj1Izquierdo", obj1Izquierdo);
        result.put("radioObj1", Math.round(r1 * 10000.0) / 10000.0);
        result.put("radioObj2", Math.round(r2 * 10000.0) / 10000.0);
        result.put("brazosDisponibles", brazosDisponibles);
        result.put("brazoSugerido", brazosDisponibles.isEmpty() ? null : brazosDisponibles.get(0));
        return result;
    }
}