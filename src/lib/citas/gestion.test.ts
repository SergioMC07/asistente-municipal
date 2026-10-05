import { describe, expect, it } from 'vitest';
import { puebloSchema } from '@/lib/pueblo';
import { nuevoToken, tokenValido } from './gestion';

describe('enlace de gestión', () => {
  it('solo acepta el token cuya huella está en la ficha', () => {
    const { token, hash } = nuevoToken();
    const pueblo = puebloSchema.parse({
      slug: 'negocio',
      tipo: 'negocio',
      nombre: 'Negocio',
      web: 'https://example.com/',
      ficha: '-',
      generadoEl: '2026-10-05T00:00:00.000Z',
      citas: { tipos: ['Cita'], duracion: 15, horario: { '1': ['10:00-11:00'] }, gestion: hash },
    });
    expect(tokenValido(pueblo, token)).toBe(true);
    expect(tokenValido(pueblo, `${token}x`)).toBe(false);
    expect(tokenValido(pueblo, null)).toBe(false);
    expect(tokenValido({ ...pueblo, citas: { ...pueblo.citas!, gestion: undefined } }, token)).toBe(false);
  });
});
