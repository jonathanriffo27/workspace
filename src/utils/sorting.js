function getTimestamp(val) {
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (val && typeof val.toMillis === 'function') return val.toMillis();
  return 0;
}

export function sortComprasItems(items) {
  return [...items].sort((a, b) => {
    const compA = !!a.completado;
    const compB = !!b.completado;
    if (compA !== compB) return compA ? 1 : -1;
    
    const posA = (a.posicion !== undefined && a.posicion !== null) ? Number(a.posicion) : Number.MAX_SAFE_INTEGER;
    const posB = (b.posicion !== undefined && b.posicion !== null) ? Number(b.posicion) : Number.MAX_SAFE_INTEGER;
    
    if (posA !== posB) return posA - posB;
    return getTimestamp(b.creadoEn) - getTimestamp(a.creadoEn);
  });
}

export function sortIdeasItems(items) {
  return [...items].sort((a, b) => {
    const archA = !!a.archivada;
    const archB = !!b.archivada;
    if (archA !== archB) return archA ? 1 : -1;
    
    const posA = (a.posicion !== undefined && a.posicion !== null) ? Number(a.posicion) : Number.MAX_SAFE_INTEGER;
    const posB = (b.posicion !== undefined && b.posicion !== null) ? Number(b.posicion) : Number.MAX_SAFE_INTEGER;
    
    if (posA !== posB) return posA - posB;
    return getTimestamp(b.creadoEn) - getTimestamp(a.creadoEn);
  });
}

export function sortTareasItems(items) {
  return [...items].sort((a, b) => {
    const archA = !!a.archivada;
    const archB = !!b.archivada;
    if (archA !== archB) return archA ? 1 : -1;

    const compA = !!a.completado;
    const compB = !!b.completado;
    if (compA !== compB) return compA ? 1 : -1;
    
    const prioA = !!a.prioridad;
    const prioB = !!b.prioridad;
    if (prioA !== prioB) return prioA ? -1 : 1;

    const posA = (a.posicion !== undefined && a.posicion !== null) ? Number(a.posicion) : Number.MAX_SAFE_INTEGER;
    const posB = (b.posicion !== undefined && b.posicion !== null) ? Number(b.posicion) : Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;

    if (a.fechaLimite && b.fechaLimite) return a.fechaLimite - b.fechaLimite;
    if (a.fechaLimite) return -1;
    if (b.fechaLimite) return 1;
    return getTimestamp(b.creadoEn) - getTimestamp(a.creadoEn);
  });
}
