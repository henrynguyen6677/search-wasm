# Changelog - Frontend

## [Latest] - Enter Key Support + CSS Loading Fix

### ✨ New Features
- **Enter Key Support**: Press Enter in pattern input field to trigger search
- **Better UX**: No need to click Search button, just type and press Enter
- **Visual Feedback**: Updated placeholder text to indicate Enter key support

### 🐛 Fixed
- **FOUC (Flash of Unstyled Content)**: Eliminated jarring visual glitch when page loads
- **CSS Race Condition**: Fixed timing issue where JavaScript executed before CSS was fully loaded
- **Loading Experience**: Added smooth loading screen with spinner animation

### ✨ Improvements
- **Professional Loading State**: Added branded loading screen with spinner
- **Smooth Transitions**: Implemented fade-out transition when loading completes
- **Error Handling**: Added fallback to hide loading screen even if CSS detection fails
- **Visual Polish**: Eliminated unstyled content flash for better UX
- **Keyboard Navigation**: Enhanced accessibility with Enter key support

### 🔧 Technical Changes
- Added `waitForStyles()` function to detect when TailwindCSS is ready
- Implemented loading screen with inline critical CSS
- Added smooth opacity transition for loading screen removal
- Enhanced error handling in main initialization
- **NEW**: Added keydown event listener for pattern input with Enter key detection
- **NEW**: Added preventDefault() to avoid form submission conflicts

### 📱 User Experience
- ✅ No more ugly unstyled content flash
- ✅ Professional loading experience  
- ✅ Smooth visual transitions
- ✅ Consistent branded appearance
- ✅ **NEW**: Quick search with Enter key
- ✅ **NEW**: Better keyboard accessibility

### 🎯 Usage
```
1. Select files
2. Type regex pattern
3. Press Enter OR click Search button
   → Both methods trigger search!
```

**Latest Commit**: `feat: add Enter key support for search input + improve UX` 