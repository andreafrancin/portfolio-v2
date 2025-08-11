# ⚛️ React TypeScript Webpack Starter

A modern, lightweight boilerplate for building high-performance **React** applications using **TypeScript** and **Webpack 5**. Designed for scalability, speed, and developer experience — this template gives you the essentials, no bloat.

---

## 📦 What's Included

- ✅ React 19 with JSX transform
- ✅ TypeScript support
- ✅ Babel 7
- ✅ Webpack 5 bundler
- ✅ Webpack Dev Server (v5) with HMR
- ✅ React Fast Refresh
- ✅ Sass/SCSS support
- ✅ Environment-based configs (development & production)
- ✅ Code splitting & content hashing for optimized builds
- ✅ Clean output with `clean-webpack-plugin`
- ✅ HTML template with `html-webpack-plugin`
- ✅ Source maps for both dev and prod
- ✅ Automatic browser launch on dev server

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/guillemleon/react-ts-template.git
cd react-ts-template
```

### 2. Remove .git folder

Remove .git folder and init your own repository.

```
rm -rf .git
```

### 3. Update package.json medatada with your project's information

### 4. Install dependencies

```bash
npm install
```

### 5. Start development server

```bash
npm run start
```

### 6. Build for production

```bash
npm run build
```

## Tips

- Use .tsx for components and .ts for utilities and logic.
- The dist/ folder is automatically cleaned before each production build.
- React Fast Refresh only works in development mode.
- Customize Webpack config by modifying the files in the config/ directory.
