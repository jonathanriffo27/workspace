# Workspace Personal - Specification

## 1. Project Overview

- **Project Name**: Workspace Personal
- **Type**: Premium mobile-first productivity web app (PWA-ready)
- **Core Functionality**: Personal productivity app with three core features: shopping list (Compras), idea capture (Ideas), and task management (Tareas)
- **Target Users**: Individual users seeking a calm, focused mobile productivity tool

## 2. UI/UX Specification

### Layout Structure

- **Mobile-first**: Optimized for Android mobile browsers
- **Viewport**: Full viewport height (100vh), no scroll on body
- **Header**: Fixed top, 56px height, contains app title and current section indicator
- **Content Area**: Scrollable, fills remaining space between header and bottom nav
- **Bottom Navigation**: Fixed bottom, 64px height, 3 tabs

### Responsive Breakpoints

- Mobile: 320px - 480px (primary target)
- Tablet: 481px - 768px (supported with max-width container)

### Visual Design

#### Color Palette

- **Background Primary**: `#0F0F0F` (near black)
- **Background Secondary**: `#1A1A1A` (dark charcoal)
- **Background Tertiary**: `#242424` (elevated surfaces)
- **Surface Card**: `#2A2A2A` (card backgrounds)
- **Border Subtle**: `#333333`
- **Text Primary**: `#FAFAFA` (off-white)
- **Text Secondary**: `#A0A0A0` (muted gray)
- **Text Tertiary**: `#666666` (placeholder)
- **Accent Primary**: `#F59E0B` (warm amber)
- **Accent Hover**: `#D97706` (darker amber)
- **Accent Glow**: `rgba(245, 158, 11, 0.15)`
- **Priority Alta**: `#EF4444` (red)
- **Priority Media**: `#F59E0B` (amber)
- **Priority Baja**: `#3B82F6` (blue)
- **Success**: `#10B981` (green)
- **Danger**: `#EF4444` (red)

#### Typography

- **Font Headers**: "DM Serif Display", serif (Google Fonts)
- **Font Body**: "DM Sans", sans-serif (Google Fonts)
- **Header App**: 24px, font-weight 400
- **Section Title**: 20px, font-weight 500
- **Card Title**: 16px, font-weight 500
- **Body Text**: 14px, font-weight 400
- **Caption**: 12px, font-weight 400
- **Line Height**: 1.5

#### Spacing System

- **Base Unit**: 4px
- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 24px
- **XXL**: 32px

#### Visual Effects

- **Border Radius Small**: 8px
- **Border Radius Medium**: 12px
- **Border Radius Large**: 16px
- **Border Radius Full**: 9999px
- **Shadow Small**: `0 2px 4px rgba(0,0,0,0.3)`
- **Shadow Medium**: `0 4px 12px rgba(0,0,0,0.4)`
- **Shadow Large**: `0 8px 24px rgba(0,0,0,0.5)`
- **Shadow Glow**: `0 0 20px rgba(245, 158, 11, 0.2)`

### Components

#### Header
- App title "Workspace" left-aligned
- Subtitle "Personal" in accent color
- Subtle bottom border
- Background with slight gradient

#### Bottom Navigation
- Three tabs: Compras, Ideas, Tareas
- Icons: shopping cart, lightbulb, checkbox
- Active state: accent color + subtle glow
- Inactive: muted text color
- Transition: 200ms ease

#### Cards (General)
- Background: #2A2A2A
- Border radius: 12px
- Padding: 16px
- Subtle shadow
- Press state: scale(0.98), darker background

#### Input Fields
- Background: #242424
- Border: 1px solid #333333
- Focus: border-color accent, subtle glow
- Border radius: 12px
- Padding: 12px 16px
- Font size: 16px (prevents zoom on mobile)

#### Buttons
- Primary: accent background, dark text
- Secondary: transparent, accent border
- Icon Button: circular, 40px
- Press animation: scale(0.95)

#### Filter Chips
- Horizontal scrollable row
- Active: accent background
- Inactive: transparent with border
- Border radius: full

#### Toast Notifications
- Slide in from bottom
- Auto-dismiss after 3s
- Success/Error variants
- Subtle shadow

#### Modals
- Centered overlay
- Background dim: rgba(0,0,0,0.7)
- Card with close button
- Entrance: fade + scale

### Animations

- **Timing**: 150ms-250ms for micro-interactions, 300ms for transitions
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) for standard, cubic-bezier(0.34, 1.56, 0.64, 1) for spring
- **Tab Switch**: Cross-fade content, animate icon/label
- **Card Press**: Transform scale + opacity
- **Item Add**: Slide in + fade
- **Item Complete**: Strikethrough + fade + checkmark animation
- **Delete**: Slide out + collapse height
- **Toast**: Slide up + fade, reverse for dismiss

## 3. Functionality Specification

### State Management

- Centralized `appState` object with reactive updates
- State structure:
  ```
  {
    activeTab: 'compras' | 'ideas' | 'tareas',
    user: FirebaseUser | null,
    userId: string | null,
    authLoading: boolean,
    compras: { items: [], filter: 'todas', multiSelect: [] },
    ideas: { items: [], searchQuery: '', multiSelect: [] },
    tareas: { items: [], filter: 'todas', multiSelect: [] },
    ui: { toast: null, modal: null }
  }
  ```

### Advanced Features

#### 🎙️ Intelligent Voice Capture (`voiceService.js`)
- **Trigger**: Long-press (>600ms) on the Microphone icon in the navigation bar.
- **Processing**: 
  - Uses Browser SpeechRecognition API for initial transcript.
  - Integration with **OpenRouter API** (`openrouter/free`) for semantic analysis.
  - Smart Categorization: Automatically routes items to Compras, Ideas, or Tareas based on intent.
  - Multi-item support: Can process lists like "comprar pan, leche y huevos" into separate documents.
- **Fallback**: Heuristic categorization if API fails or key is missing.

#### 📦 Automated Task Archiver (`taskArchiver.js`)
- **Schedule**: Runs daily at 3 AM (local time).
- **Functionality**: Moves documents from active collections to archives based on completion status.
- **Persistence**: Tracks last archive run in `localStorage` to ensure execution after downtime.

#### Multi-Select & Bulk Actions
- **State**: Each module maintains a `multiSelect` array in `appState` containing document IDs.
- **UI**: Checkbox on each card (distinct from completion checkbox) + floating action bar.
- **Actions**: Bulk delete and bulk archive (where applicable).

#### Positioning & Sorting
- **Field**: `posicion` (number) in Firestore documents.
- **Logic**: 
  - New items are added with a `posicion` smaller than the current minimum (top of list).
  - Sorting: Documents are ordered by `completado` (false first) and then by `posicion` ascending.
  - Drag & Drop: Integrated with `sortable.js` to update positions in real-time.

### Authentication
... (rest of section) ...

**Features:**
- Firebase Authentication with two methods:
  - Email/Password (login and registration)
  - Google Sign-In (OAuth popup)
- Protected app content (login required)
- User session persistence via Firebase Auth
- User-specific data isolation (Firestore queries filtered by userId)
- Logout functionality

**Auth UI Elements:**
- Full-screen login overlay blocking app access
- Tabbed interface: "Iniciar Sesión" / "Registrarse"
- Email input with validation
- Password input (min 6 characters for registration)
- Error messages in Spanish for common Firebase auth errors
- Google Sign-In button with Google logo
- User info display in header after login (name + logout button)

**Auth State Flow:**
1. App loads → `onAuthStateChanged` callback fires
2. If no user → `showLoginScreen()` renders login UI
3. If user authenticated → `hideLoginScreen()`, `updateHeaderForUser()`, `initFirestoreSync()`
4. On logout → `signOut(auth)` → auth state changes → login screen shown again

**Security Rules (Firestore):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### Firebase Console Configuration Required

**Dominios autorizados (Authentication > Configuración > Dominios autorizados):**
- localhost
- 165.1.126.90

**Habilitar métodos de autenticación:**
- Correo electrónico/contraseña
- Google (configurar correo de soporte)

### Storage Layer

- Three separate localStorage keys:
  - `workspace_compras`: Array of shopping items
  - `workspace_ideas`: Array of ideas
  - `workspace_tareas`: Array of tasks
- Schema version stored in each key
- Auto-save on every state change
- Safe JSON parsing with fallback to empty arrays

### Section 1: Compras (Shopping List)

**Features:**
- Add item with name + category
- Categories: Supermercado, Internet, Farmacia, Otros
- Mark item as completed (checkbox)
- Delete item (swipe or button)
- Filter by category (filter chips)
- Sort: incomplete first, then by creation date

**Item Structure:**
```javascript
{
  id: string (UUID),
  nombre: string,
  categoria: 'supermercado' | 'internet' | 'farmacia' | 'otros',
  completado: boolean,
  userId: string (Firebase UID),
  creadoEn: timestamp
}
```

**UI Elements:**
- Quick-add input at top with category selector
- Category filter chips below input
- Scrollable list of item cards
- Each card: checkbox, name, category badge, delete button
- Completed items: faded (opacity 0.5), strikethrough text

### Section 2: Ideas

**Features:**
- Add idea with title + optional notes
- Expand/collapse notes on tap
- Archive idea
- Delete idea
- Search ideas by title (debounced, 300ms)

**Item Structure:**
```javascript
{
  id: string (UUID),
  titulo: string,
  notas: string,
  archivada: boolean,
  userId: string (Firebase UID),
  creadoEn: timestamp
}
```

**UI Elements:**
- Search input at top
- "Add Idea" floating button or input
- Card list showing title + preview of notes
- Expanded view: full notes in textarea
- Archive/Delete actions on each card

### Section 3: Tareas (Tasks)

**Features:**
- Add task with title + priority + optional due date
- Priority levels: Alta (red), Media (amber), Baja (blue)
- Mark task as completed
- Delete task
- Filter: Todas, Pendientes, Completadas
- Sort: incomplete first, then by priority (Alta > Media > Baja), then by due date

**Item Structure:**
```javascript
{
  id: string (UUID),
  titulo: string,
  prioridad: 'alta' | 'media' | 'baja',
  fechaLimite: timestamp | null,
  completado: boolean,
  userId: string (Firebase UID),
  creadoEn: timestamp
}
```

**UI Elements:**
- Add task input with priority selector and date picker
- Filter chips: Todas, Pendientes, Completadas
- Task cards with: checkbox, priority indicator (color dot/badge), title, due date badge
- Completed tasks: faded, strikethrough

### Reusable UI Components

- Card component factory
- Button component factory (primary, secondary, icon)
- Input component factory
- Modal component
- Toast notification system
- Filter chip row
- Badge component
- Empty state component
- Checkbox component

### Edge Cases

- Empty states for each section with helpful messages
- Handle localStorage quota exceeded
- Handle corrupted JSON (reset to defaults)
- Prevent duplicate IDs
- Handle very long text (truncate with ellipsis)
- Date validation for due dates

## 4. Acceptance Criteria

### Visual Checkpoints

- [ ] Dark theme with charcoal backgrounds renders correctly
- [ ] Amber accent color visible on interactive elements
- [ ] Typography uses DM Serif Display for headers, DM Sans for body
- [ ] Bottom navigation shows 3 tabs with icons
- [ ] Cards have proper border radius and shadows
- [ ] Animations are smooth (60fps target)

### Functional Checkpoints

- [ ] Can add shopping items with category
- [ ] Can mark shopping items as completed
- [ ] Can delete shopping items
- [ ] Can filter shopping by category
- [ ] Can add ideas with title and notes
- [ ] Can expand/collapse idea notes
- [ ] Can archive ideas
- [ ] Can delete ideas
- [ ] Can search ideas
- [ ] Can add tasks with priority and due date
- [ ] Can mark tasks as completed
- [ ] Can delete tasks
- [ ] Can filter tasks
- [ ] Data persists after page reload (localStorage)
- [ ] Toast notifications appear and dismiss

### Performance Checkpoints

- [ ] Initial load under 2 seconds
- [ ] Smooth scrolling (no jank)
- [ ] Animations don't cause layout thrashing
- [ ] Efficient DOM updates (no full re-renders)

### Accessibility Checkpoints

- [ ] Touch targets minimum 44px
- [ ] Sufficient contrast (WCAG AA)
- [ ] Semantic HTML structure
- [ ] Proper button labels