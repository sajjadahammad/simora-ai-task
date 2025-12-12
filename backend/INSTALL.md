# Installation Guide

## Standard Installation (Without Database)

The app works perfectly without a database. Just run:

```bash
npm install
```

The `better-sqlite3` package is marked as optional, so it won't fail if it can't be installed.

## Installing with Database Support (Windows)

If you want to use the database feature (`USE_DATABASE=true`), you need to install Visual Studio Build Tools:

### Option 1: Install Visual Studio Build Tools

1. Download and install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. During installation, select "Desktop development with C++" workload
3. Run `npm install` again

### Option 2: Use Pre-built Binaries

Try installing with pre-built binaries:

```bash
npm install better-sqlite3 --build-from-source=false
```

### Option 3: Skip Database (Recommended for Windows)

Just set `USE_DATABASE=false` in your `.env` file. The app works perfectly without it - you just won't have video history stored in a database.

## Troubleshooting

### Error: "Could not find Visual Studio installation"

This means `better-sqlite3` needs to compile native code. Solutions:

1. **Easiest**: Set `USE_DATABASE=false` in `.env` (recommended)
2. Install Visual Studio Build Tools (see Option 1 above)
3. Use WSL (Windows Subsystem for Linux) where installation is easier

### The app works without the database!

The database is completely optional. Without it:
- ✅ Video upload works
- ✅ Caption generation works  
- ✅ Video preview works
- ✅ Video export works
- ❌ Video history/retrieval endpoints won't work (but you don't need them)

