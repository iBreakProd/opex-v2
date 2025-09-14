export function wsToAppSymbol(wsSymbol: string): string {
  if (wsSymbol.endsWith("_USDC_PERP")) {
    return wsSymbol.replace("_USDC_PERP", "USDC").replaceAll("_", "");
  }
  return wsSymbol.replaceAll("_", "");
}

export function appToBackendSymbol(appSymbol: string): string {
  if (appSymbol.endsWith("USDC")) {
    const base = appSymbol.slice(0, -4);
    return `${base}_USDC_PERP`;
  }
  return appSymbol;
}

export function backendToAppSymbol(backendSymbol: string): string {
  if (backendSymbol.endsWith("_USDC_PERP")) {
    return backendSymbol.replace("_USDC_PERP", "USDC").replaceAll("_", "");
  }
  return backendSymbol.replaceAll("_", "");
}
