import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4173');
  
  // Inject state and navigation via internal app function
  await page.evaluate(() => {
    const login = document.getElementById('login-screen');
    if (login) login.remove();
    localStorage.setItem('workspace_user_id', 'test-user');
    localStorage.setItem('workspace_tareas', JSON.stringify([
      { id: '1', titulo: 'Test Tarea', prioridad: 'alta', completado: false, notas: 'Nota de prueba' }
    ]));
    
    // Explicitly invoke switchTab if exposed globally, or trigger UI click on button
    // Based on src/app.js, init() registers listeners. If not global, use UI click.
    document.querySelector('button[data-tab="tareas"]').click();
  });
  
  // Wait for the container to become active (visible)
  await page.waitForSelector('#tareas-section', { state: 'visible' });
  
  // Click on the first task to expand it
  const task = await page.locator('.item-card.task >> nth=0');
  await task.waitFor({ state: 'attached' });
  await task.click();
  
  // Wait for transition/expansion
  await page.waitForTimeout(1000); 
  
  // Take screenshot
  await page.screenshot({ path: 'tareas-expanded-screenshot.png' });
  console.log('Screenshot saved as tareas-expanded-screenshot.png');
  
  await browser.close();
})();
