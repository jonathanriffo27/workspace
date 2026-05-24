import { chromium, devices } from 'playwright';

(async () => {
  const iPhone13 = devices['iPhone 13'];
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...iPhone13,
    colorScheme: 'dark',
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('PAGE:', msg.text()));

  await page.addInitScript(() => {
    localStorage.setItem('workspace_theme', 'dark');
    localStorage.setItem('workspace_last_user_id', 'test-user');
    // Forzado extra en el inicio
    window.addEventListener('DOMContentLoaded', () => {
      document.documentElement.dataset.theme = 'dark';
    });
  });

  const captureSection = async (tab, path, expandSelector = null) => {
    console.log(`Capturing ${tab} mode dark...`);
    await page.goto(`http://localhost:4173/?debug#${tab}`, { waitUntil: 'networkidle' });
    
    await page.evaluate(async (t) => {
      document.documentElement.dataset.theme = 'dark';
      // Force background to be dark immediately in case CSS is slow
      document.body.style.background = '#0A0A0A';
      
      if (window.appState) {
        window.appState.compras.loading = false;
        window.appState.ideas.loading = false;
        window.appState.tareas.loading = false;
        window.appState.activeTab = t;
        window.notify();
      }
      
      const btn = document.querySelector(`button[data-tab="${t}"]`);
      if (btn) btn.click();
      
      console.log('Theme set to:', document.documentElement.dataset.theme);
    }, tab);

    await page.waitForTimeout(1500); // Give it plenty of time

    if (expandSelector) {
      const el = page.locator(expandSelector).first();
      await el.waitFor({ state: 'visible' });
      await el.click();
      await page.waitForTimeout(800);
    }

    await page.screenshot({ path });
    console.log(`Dark mode screenshot saved: ${path}`);
  };

  // Inject initial task data via localStorage too to be sure
  await page.addInitScript(() => {
    localStorage.setItem('workspace_tareas_test-user', JSON.stringify([
      { id: '1', titulo: 'Completar documentación', prioridad: 'alta', completado: false, notas: 'Actualizar README y SPEC', posicion: 1, creadoEn: Date.now(), userId: 'test-user' },
      { id: '2', titulo: 'Revisar alineación UI', prioridad: 'media', completado: true, notas: 'Verificar scrollbar', posicion: 2, creadoEn: Date.now(), userId: 'test-user' }
    ]));
    localStorage.setItem('workspace_compras_test-user', JSON.stringify([
      { id: 'c1', nombre: 'Leche de Almendras', categoria: 'supermercado', completado: false, prioridad: true, posicion: 1, creadoEn: Date.now(), userId: 'test-user' },
      { id: 'c2', nombre: 'Proteína en polvo', categoria: 'supermercado', completado: true, prioridad: false, posicion: 2, creadoEn: Date.now(), userId: 'test-user' }
    ]));
    localStorage.setItem('workspace_ideas_test-user', JSON.stringify([
      { id: 'i1', titulo: 'Refactorizar servicios', notas: 'Mover lógica de Firebase a un hook centralizado para mejorar la reactividad.', archivada: false, posicion: 1, creadoEn: Date.now(), userId: 'test-user' }
    ]));
  });

  // --- TAREAS ---
  await captureSection('tareas', 'src/tareas.png', '#tareas-section .item-card.task:not(.skeleton-card)');

  // --- COMPRAS ---
  await captureSection('compras', 'src/compras.png');

  // --- IDEAS ---
  await captureSection('ideas', 'src/ideas.png', '#ideas-section .item-card.idea:not(.skeleton-card)');

  await browser.close();
})();
