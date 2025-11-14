// src/utils/money.js
export function moneyAR(n) {
  if (n == null || n === '' || isNaN(Number(n))) return 'Consultar';
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(Number(n));
  } catch {
    return String(n);
  }
}

export default moneyAR;
