/**
 * Formatea un RUT chileno con puntos y guion.
 * @param rut RUT a formatear. Debe contener solo números y un guión, sin puntos.
 * @returns El RUT formateado con puntos y guion.
 */
export function formatRut(rut: string): string {
  const [number, dv] = rut.split('-');
  const reversedNumber = number.split('').reverse().join('');
  const formattedNumber = reversedNumber.replace(/(\d{3})(?=\d)/g, '$1.');
  const finalNumber = formattedNumber.split('').reverse().join('');
  return (finalNumber.length === 9 ? '0' + finalNumber : finalNumber) + '-' + dv;
}