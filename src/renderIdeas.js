  function renderIdeasSection() {
    const section = document.getElementById('ideas-section');
    const { items, searchQuery } = appState.ideas;

    let filtered = items;
    if (searchQuery) {
      filtered = items.filter(idea => 
        (idea.titulo && idea.titulo.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (idea.notas && idea.notas.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    const sorted = sortIdeasItems(filtered);
    const totalIdeas = items.length;
    const archivedIdeas = items.filter(i => i.archivada).length;

    section.innerHTML = `
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">${totalIdeas}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item completed">
          <span class="stat-value">${archivedIdeas}</span>
          <span class="stat-label">Hecho</span>
        </div>
        <div class="stat-item pending">
          <span class="stat-value">${totalIdeas - archivedIdeas}</span>
          <span class="stat-label">Pendiente</span>
        </div>
      </div>

      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" id="idea-search" class="search-field" placeholder="Buscar ideas..." value="${searchQuery || ''}" autocomplete="off">
        </div>
      </div>

      <div class="input-wrapper">
        ${renderActionInput('idea-title-input', 'Escribe una nueva idea...')}
      </div>

      <div class="items-list" id="ideas-list">
        ${sorted.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3 class="empty-title">Sin ideas</h3>
            <p class="empty-text">${searchQuery ? 'No hay coincidencias' : 'Captura tus pensamientos aquí'}</p>
          </div>
        ` : ''}
      </div>
    `;

    if (sorted.length > 0) {
      const list = section.querySelector('#ideas-list');
      sorted.forEach((idea) => {
        const card = document.createElement('div');
        card.className = `item-card idea ${idea.archivada ? 'completed' : ''}`;
        card.dataset.id = idea.id;

        const expandIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 9l6 6 6-6"/></svg>`;

        card.innerHTML = `
          <div class="checkbox ${idea.archivada ? 'checked' : ''}" data-id="${idea.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="item-content">
            <div class="item-row">
              <span class="item-text">${idea.titulo}</span>
              <div class="task-meta" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                <button class="expand-indicator-btn" style="background:transparent; border:none; color:var(--text-tertiary); display:flex; padding:0;">
                  ${expandIcon}
                </button>
              </div>
            </div>
            <div class="idea-notes-wrapper">
              <textarea data-id="${idea.id}" placeholder="Desarrolla tu idea aquí...">${idea.notes || idea.notas || ''}</textarea>
              <div class="sync-indicator">
                <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                Guardado
              </div>
            </div>
          </div>
          <div class="item-actions-side">
            <button class="delete-btn" data-id="${idea.id}">
              <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="save-idea-btn icon-only" data-id="${idea.id}" title="Guardar cambios">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            </button>
          </div>
        `;
        list.appendChild(card);
      });
    }

    attachIdeasEvents();
  }

  function attachIdeasEvents() {
    const titleInput = document.getElementById('idea-title-input');
    const addBtn = document.getElementById('idea-title-input-btn');
    const searchInput = document.getElementById('idea-search');
    const list = document.getElementById('ideas-list');

    const addIdea = async () => {
      const titulo = titleInput.value.trim();
      if (!titulo) return;

      try {
        await addDoc(collections.ideas, {
          titulo,
          notas: '',
          archivada: false,
          creadoEn: serverTimestamp()
        });
        titleInput.value = '';
        showToast('Idea capturada', 'success');
      } catch (err) {
        showToast('Error al guardar idea', 'error');
      }
    };

    addBtn.addEventListener('click', addIdea);
    titleInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addIdea(); });

    let searchDebounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        appState.ideas.searchQuery = e.target.value;
        renderIdeasSection();
        const input = document.getElementById('idea-search');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 300);
    });

    list.addEventListener('click', async (e) => {
      const checkbox = e.target.closest('.checkbox');
      const deleteBtn = e.target.closest('.delete-btn');
      const expandBtn = e.target.closest('.idea-action-btn') || e.target.closest('.item-row');
      const saveBtn = e.target.closest('.save-idea-btn');
      
      if (checkbox) {
        const id = checkbox.dataset.id;
        toggleArchiveIdea(id);
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        deleteIdea(id);
      }

      if (saveBtn) {
        const id = saveBtn.dataset.id;
        const card = saveBtn.closest('.item-card');
        const textarea = card.querySelector('textarea');
        const sync = card.querySelector('.sync-indicator');
        const notes = textarea.value;

        saveBtn.disabled = true;
        const originalIcon = saveBtn.innerHTML;
        saveBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>';

        try {
          await updateDoc(doc(db, "ideas", id), { notas: notes });
          saveBtn.innerHTML = originalIcon;
          saveBtn.disabled = false;
          
          sync.classList.add('visible');
          setTimeout(() => sync.classList.remove('visible'), 2000);
        } catch (err) {
          showToast('Error al guardar', 'error');
          saveBtn.innerHTML = originalIcon;
          saveBtn.disabled = false;
        }
      }

      if (expandBtn && !e.target.closest('.checkbox') && !e.target.closest('.delete-btn') && !e.target.closest('.save-idea-btn') && !e.target.closest('textarea')) {
        const card = expandBtn.closest('.item-card');
        card.classList.toggle('expanded');
      }
    });
  }
