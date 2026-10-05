package pe.edu.upc.ecogasto.dtos;

import jakarta.validation.constraints.*;

public class ValoracionDTO {

    @NotNull(message = "Indica si el tip te sirvio")
    private Boolean util;

    public ValoracionDTO() {
    }

    public Boolean getUtil() {
        return util;
    }

    public void setUtil(Boolean util) {
        this.util = util;
    }
}
