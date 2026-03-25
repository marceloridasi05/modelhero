# Design Guidelines: Plastimodelismo Kit Tracker

## Design Approach
**Selected Approach:** Design System (Productivity Dashboard)
**Justification:** This is a utility-focused productivity application requiring information-dense layouts, data visualization, and efficient workflows. Drawing inspiration from Linear, Notion, and Asana for clean dashboard patterns while maintaining the unique modeling community aesthetic.

## Color System (User-Specified Palette)
- **Primary (Hunter Green):** #3E5641 - Primary actions, navigation highlights
- **Secondary (Spicy Paprika):** #D36135 - CTAs, "Novo Kit" buttons, important metrics
- **Accent (Muted Teal):** #83BCA9 - Progress indicators, success states, tags
- **Tertiary (Reddish Brown):** #A24936 - Secondary actions, warnings, status indicators
- **Neutral (Graphite):** #282B28 - Text, borders, backgrounds
- **Surfaces:** White/Light gray backgrounds with subtle graphite tints

## Typography
- **Primary Font:** Inter or Manrope via Google Fonts
- **Headings:** 
  - H1: 2xl-3xl, semibold (Dashboard titles)
  - H2: xl-2xl, semibold (Section headers)
  - H3: lg-xl, medium (Card titles, Kit names)
- **Body:** Base size, regular weight
- **Data/Stats:** Tabular nums, medium-semibold for emphasis

## Layout System
**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, 16 (p-2, m-4, gap-6, py-8, etc.)
- Mobile: p-4 container padding, gap-4 between elements
- Desktop: p-8 container padding, gap-6 between cards

**Grid Systems:**
- Stats cards: grid-cols-2 md:grid-cols-4 (Home dashboard)
- Kit cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 (Em Andamento)
- Kit list: Single column with responsive table/card switching

## Component Library

### Navigation
- Sidebar navigation (desktop): Fixed left, ~240px width, Hunter Green background
- Bottom tab bar (mobile): Fixed, 4 icons (Home, Em Andamento, Kits, Estatísticas)
- Active states: Spicy Paprika accent with Muted Teal underline/indicator

### Dashboard Cards (Home)
- Stat cards: White background, subtle shadow, rounded corners (rounded-lg)
- Layout: Icon (Muted Teal) + Label + Large number (Spicy Paprika for key metrics)
- Hover: Slight elevation increase

### Kit Cards (Em Andamento)
- Card structure: Image placeholder/thumbnail + Title + Progress bar + Metadata grid
- Progress bar: Muted Teal fill, light gray background
- Metadata: Small text showing Marca, Escala, Status tags
- Action buttons: Edit/view icon buttons in top-right

### Kit List (Kits Section)
- Desktop: Table layout with sortable columns
- Mobile: Stacked cards with collapsible details
- Row/card includes: Brand, Scale, Type, Rating (stars 0-10 using Spicy Paprika), Status tag, Destino tag
- Tags: Pill shape, rounded-full, color-coded by category

### Filters & Search
- Search bar: Prominent, top of Kits section, icon-left input
- Filter chips: Horizontal scrollable row, toggleable, Hunter Green when active
- Filter categories: Status dropdown, Destino dropdown, Clear all button

### Forms (Novo Kit)
- Modal or slide-in panel approach
- Input groups with labels above inputs
- Dropdowns for Status/Destino with colored indicators
- Rating input: Star selector (0-10)
- Number inputs: For value, hours (with increment/decrement buttons)
- Submit button: Spicy Paprika, full-width on mobile

### Statistics Dashboard
- Large metric cards in grid layout
- Charts/graphs using Muted Teal for primary data, Spicy Paprika for highlights
- Donut charts for kit distribution by status
- Bar charts for monthly progress/hours

## Data Visualization
- Use Chart.js or Recharts with custom color mappings
- Primary chart color: Muted Teal (#83BCA9)
- Accent/comparison: Spicy Paprika (#D36135)
- Grid lines: Light Graphite with low opacity

## Buttons & CTAs
- Primary: Spicy Paprika background, white text, rounded-lg
- Secondary: Hunter Green outline, Hunter Green text
- Icon buttons: Square/circular, Graphite with hover states
- "Novo Kit" buttons: Prominent, Spicy Paprika, with plus icon

## Responsiveness
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Mobile-first approach
- Collapsible sidebar on tablet/mobile
- Stack stat cards vertically on mobile
- Transform tables to cards on mobile

## Images
No hero images needed. This is a productivity dashboard.
**Kit Thumbnails:** 16:9 or 4:3 aspect ratio placeholders for kit photos in cards, rounded corners (rounded-md)

## Animations
Minimal and purposeful:
- Smooth transitions on hover (150ms)
- Slide-in for modals/panels (200ms)
- Fade for stat changes (300ms)
- No decorative animations