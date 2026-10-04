// Datos del titular para el aviso legal (LSSI, art. 10). Se configuran con
// variables de entorno para no dejar datos personales en el código.

import { contactWhatsapp, formatPhone } from '@/lib/contact';

export function titular() {
  return {
    nombre: process.env.NEXT_PUBLIC_TITULAR_NOMBRE?.trim(),
    nif: process.env.NEXT_PUBLIC_TITULAR_NIF?.trim(),
    domicilio: process.env.NEXT_PUBLIC_TITULAR_DOMICILIO?.trim(),
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim(),
    telefono: formatPhone(contactWhatsapp()),
  };
}
