# Theming & UI Customization

Glide uses **Nuxt UI** alongside **Tailwind CSS** to achieve its premium, state-of-the-art interface.

## 1. Color Palette & Dark Mode
Glide is fundamentally designed around a premium **Dark Mode** experience.
- **Surfaces:** We use deep, rich tones (e.g., `bg-[#141417]`) instead of generic pure blacks, creating a softer and more modern dark mode.
- **Borders & Dividers:** Very subtle borders (`border-neutral-800` or `border-white/5`) are used to separate content without creating visual noise.
- **Primary Highlights:** The primary color ramp is used sparingly to draw attention to active states, buttons, and important activity (like the GitHub-style Heatmap).

## 2. Component Aesthetics
- **Cards & Modals:** Interfaces utilize slight padding, rounded corners (`rounded-xl`), and subtle drop shadows.
- **Micro-interactions:** Hover effects (like `hover:bg-neutral-800` or opacity transitions) are strictly enforced across buttons, table rows, and navigational elements to make the app feel alive.
- **Typography:** We use modern, clean sans-serif typography with tight tracking (`tracking-tight`) for headings to evoke a premium feel.

## 3. Modals and Overlays
- **Custom Tooltips:** Instead of native HTML `title` attributes, we use fixed-position floating `div` elements for tooltips to ensure they are never clipped by `overflow-hidden` containers.
- **Dialogs:** All modals strictly live inside the `modal/` folder as distinct Vue components to maintain a clean structure.
