# ScoreWrx Logo Visual Reference

## Logo Design

The ScoreWrx logo is inspired by the **Softspikes spider golf spike** design. Here's what it represents:

### Design Structure

```
        ╱╲
       ╱  ╲    ← Spike 1 (top)
      ╱    ╲
     
╱╲          ╱╲
  ╲        ╱    ← Spikes 2 & 6
   ╲  ⚫  ╱       (sides)
    ╲    ╱
     ╲  ╱

╲      ╱╲      ╱
 ╲            ╱  ← Spikes 3 & 5
  ╲          ╱     (lower sides)
   
      ╲  ╱
       ╲╱        ← Spike 4 (bottom)
```

### Color Breakdown

- **Center Circle**: Dark blue (#1e40af) with whitesmoke dimples
- **Spike Left Side**: Dark blue (#1e40af)
- **Spike Right Side**: Medium blue (#2563eb) - creates depth
- **Background**: Whitesmoke (#f5f5f5) in icons
- **Stroke**: Whitesmoke outline on center circle

### Key Features

1. **6 Radiating Spikes**
   - Positioned at 60° intervals
   - Each spike has two parts (left/right) for 3D effect
   - Tapered from wide at base to point at tip

2. **Golf Ball Texture**
   - 5 dimple circles on center
   - Subtle opacity (30-40%)
   - Adds authenticity to golf theme

3. **Size Variations**
   - Logo: 200x200px (main use)
   - Icon-512: 512x512px (PWA)
   - Icon-192: 192x192px (Apple touch)
   - Favicon: 32x32px (browser tab)

## Usage Examples

### In React Components

```tsx
// Large logo for branding
<Logo size={200} className="drop-shadow-xl" />

// Medium size for headers
<Logo size={80} />

// Small icon for navigation
<LogoIcon size={32} className="mr-2" />

// Tiny icon for inline use
<LogoIcon size={24} />
```

### Color Combinations

Works well with:
- White backgrounds ✓
- Light gray backgrounds ✓
- Blue gradients ✓
- Dark backgrounds (with adjustments)

### Where It's Used

1. **Browser Tab** - favicon.svg
2. **Login Page** - 100px logo on blue gradient panel
3. **Register Page** - 100px logo on green gradient panel
4. **PWA Installation** - 512px and 192px icons
5. **Apple Touch Icon** - 192px icon

## Design Philosophy

The spider golf spike represents:
- **Precision** - Like scoring in golf
- **Stability** - Multiple points of contact (spikes on ground)
- **Professional** - Real golf equipment reference
- **Modern** - Geometric, clean design
- **Memorable** - Unique shape stands out

## Comparison to Inspiration

**Softspikes Black Widow:**
- Multiple radiating legs ✓
- Counter-rotational design ✓
- Golf-specific purpose ✓
- Professional appearance ✓

**ScoreWrx Logo:**
- 6 radiating spikes ✓
- Two-tone depth effect ✓
- Golf ball dimple texture ✓
- No text clutter ✓

---

**The logo successfully captures the essence of golf equipment while maintaining a modern, scalable, and professional appearance suitable for a scoring application.**

