# Development Guidelines

## Project Overview
This document outlines the coding standards and practices for the Heal React Native Expo application.

## Design System

### Typography
- **Font Family**: Roboto (all text components)
- Use consistent font weights: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)

### Colors
- **Always import colors from `colors.json`**
- **NO hardcoded color values allowed**
- Available colors:
  - `primary`: #EB7E9F
  - `secondary`: #9260B5
  - `background`: #FFFAFA
  - `secondaryBackground`: #F3F3F3
  - `accent`: #9260B5

```javascript
// ✅ Correct
import colors from './colors.json';
<View style={{ backgroundColor: colors.primary }} />

// ❌ Wrong
<View style={{ backgroundColor: '#EB7E9F' }} />
```

## Code Quality Standards

### Industrial Approach
- Write clean, maintainable, and scalable code
- Follow SOLID principles
- Avoid code smells (duplicated code, long methods, large classes)
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility

### Code Organization
- **Components**: Reusable UI components in `components/` directory
- **Screens**: Screen-level components in `screens/` directory
- **Utils**: Helper functions and utilities in `utils/` directory
- **Constants**: App constants in `constants/` directory
- **Assets**: All images organized by type (logo, people, doctors, icons, stock)

### File Structure
```
heal/
├── assets/
│   ├── images/
│   │   ├── logo/
│   │   ├── people/
│   │   ├── doctors/
│   │   ├── icons/
│   │   └── stock/
├── components/
├── screens/
├── utils/
├── constants/
├── colors.json
└── guidelines.md
```

## Best Practices

### Component Structure
- Use functional components with hooks
- PropTypes or TypeScript for type checking
- Separate business logic from UI rendering
- Extract reusable logic into custom hooks

### Styling
- Use StyleSheet.create() for performance
- Avoid inline styles when possible
- Create reusable style constants
- Use consistent spacing and sizing

### Performance
- Optimize re-renders with React.memo when needed
- Use useCallback and useMemo appropriately
- Lazy load images and heavy components
- Avoid unnecessary state updates

### Code Review Checklist
- [ ] No hardcoded colors (all from colors.json)
- [ ] Roboto font family used consistently
- [ ] No code duplication
- [ ] Functions are small and focused
- [ ] Meaningful naming conventions
- [ ] Proper file organization
- [ ] No unused imports or variables
- [ ] Proper error handling

## Git Practices
- Write clear, descriptive commit messages
- Keep commits atomic and focused
- Review your own code before submitting PR
- Ensure app runs without errors before committing

---

**Remember**: Quality over quantity. Write code that other developers will thank you for.
