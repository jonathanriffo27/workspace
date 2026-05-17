export function sortComprasItems(items) {
  return [...items].sort((a, b) => {
    if (a.completado !== b.completado) return a.completado ? 1 : -1;
    return b.creadoEn - a.creadoEn;
  });
}

export function sortIdeasItems(items) {
  return [...items].sort((a, b) => {
    if (a.archivada !== b.archivada) return a.archivada ? 1 : -1;
    return b.creadoEn - a.creadoEn;
  });
}

export function sortTareasItems(items) {
  const priorityOrder = { alta: 0, media: 1, baja: 2 };
  return [...items].sort((a, b) => {
    if (a.completado !== b.completado) return a.completado ? 1 : -1;
    if (priorityOrder[a.prioridad] !== priorityOrder[b.prioridad]) {
      return priorityOrder[a.prioridad] - priorityOrder[b.prioridad];
    }
    if (a.fechaLimite && b.fechaLimite) return a.fechaLimite - b.fechaLimite;
    if (a.fechaLimite) return -1;
    if (b.fechaLimite) return 1;
    return b.creadoEn - a.creadoEn;
  });
}
