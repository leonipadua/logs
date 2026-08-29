import { describe, it, expect } from "vitest";
import { formatPercentPtBR } from "./percent";

describe("formatPercentPtBR", () => {
  it("formata fração como percentual inteiro com o sinal %", () => {
    expect(formatPercentPtBR(0.625).replace(/\s/g, "")).toBe("63%");
    expect(formatPercentPtBR(0).replace(/\s/g, "")).toBe("0%");
    expect(formatPercentPtBR(1).replace(/\s/g, "")).toBe("100%");
  });

  it("arredonda para inteiro (sem casas decimais)", () => {
    expect(formatPercentPtBR(0.004).replace(/\s/g, "")).toBe("0%");
    expect(formatPercentPtBR(0.006).replace(/\s/g, "")).toBe("1%");
  });
});
