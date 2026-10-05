package pe.edu.upc.ecogasto.util;

public class Numeros {

    public static Double aDouble(Object valor) {
        if (valor == null) {
            return null;
        }
        return ((Number) valor).doubleValue();
    }

    public static Integer aEntero(Object valor) {
        if (valor == null) {
            return null;
        }
        return ((Number) valor).intValue();
    }

    public static Double redondear(Double valor) {
        if (valor == null) {
            return null;
        }
        return Math.round(valor * 100.0) / 100.0;
    }
}
