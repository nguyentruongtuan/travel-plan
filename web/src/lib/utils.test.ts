import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyInput, parseMoneyInput } from "./utils";

// Intl uses U+00A0 (no-break space) between the amount and the symbol.
const nbsp = " ";

describe("formatMoney", () => {
  it("formats amounts as Vietnamese đồng with dot thousand separators", () => {
    expect(formatMoney(1234567)).toBe(`1.234.567${nbsp}₫`);
  });

  it("shows zero as 0 ₫", () => {
    expect(formatMoney(0)).toBe(`0${nbsp}₫`);
  });

  it("rounds to whole đồng (VND has no minor unit)", () => {
    expect(formatMoney(1500.6)).toBe(`1.501${nbsp}₫`);
  });
});

describe("formatMoneyInput", () => {
  it("groups typed digits with dots", () => {
    expect(formatMoneyInput("1234567")).toBe("1.234.567");
  });

  it("re-groups a value the user edited mid-string", () => {
    expect(formatMoneyInput("1.2345.67")).toBe("1.234.567");
  });

  it("drops anything that is not a digit", () => {
    expect(formatMoneyInput("50k ₫")).toBe("50");
  });

  it("drops leading zeros but keeps a lone zero", () => {
    expect(formatMoneyInput("000250")).toBe("250");
    expect(formatMoneyInput("0")).toBe("0");
  });

  it("returns an empty string when there are no digits", () => {
    expect(formatMoneyInput("")).toBe("");
  });
});

describe("parseMoneyInput", () => {
  it("reads a dot-grouped field value as whole đồng", () => {
    expect(parseMoneyInput("1.234.567")).toBe(1234567);
  });

  it("treats an empty field as 0", () => {
    expect(parseMoneyInput("")).toBe(0);
  });
});
