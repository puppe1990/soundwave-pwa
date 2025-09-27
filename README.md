# 🎵 SoundWave PWA

A modern, responsive Progressive Web App (PWA) audio player built with React, TypeScript, and Tailwind CSS. SoundWave offers a sleek, mobile-first design with playlist management, audio file uploads, and offline capabilities.

![SoundWave PWA](https://img.shields.io/badge/PWA-enabled-brightgreen) ![React](https://img.shields.io/badge/React-18.3.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue) ![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF)

## ✨ Features

### 🎧 Core Audio Features
- **High-quality audio playback** with custom controls
- **Playlist management** with drag-and-drop support
- **Audio file upload** (MP3, WAV, OGG, M4A)
- **Seek and volume controls** with smooth animations
- **Track information display** with album artwork
- **Shuffle and repeat modes**

### 📱 Progressive Web App
- **Offline functionality** with service worker caching
- **Installable** on mobile and desktop devices
- **Responsive design** optimized for all screen sizes
- **Fast loading** with optimized assets and caching
- **Native app-like experience** with standalone display mode

### 🎨 Modern UI/UX
- **Beautiful gradient design** with glassmorphism effects
- **Dark theme** optimized for music listening
- **Smooth animations** and transitions
- **Mobile-first responsive layout**
- **Accessible** with keyboard navigation support

### 🔧 Developer Features
- **TypeScript** for type safety
- **Component-based architecture** with React hooks
- **Modern build tools** with Vite
- **ESLint** for code quality
- **Hot module replacement** for fast development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser with PWA support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/soundwave-pwa.git
   cd soundwave-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080` to see the app in action.

### Building for Production

```bash
npm run build
npm run preview
```

## 📱 PWA Installation

### Mobile (iOS/Android)
1. Open the app in your mobile browser
2. Tap the "Add to Home Screen" prompt
3. The app will be installed as a native-like experience

### Desktop (Chrome/Edge)
1. Open the app in your browser
2. Click the install icon in the address bar
3. The app will be added to your applications

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library with hooks
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 5.4.19** - Fast build tool and dev server
- **React Router 6.30.1** - Client-side routing

### Styling & UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Beautiful icon library
- **Tailwind Animate** - Animation utilities

### PWA & Performance
- **Vite PWA Plugin** - PWA configuration and service worker
- **Workbox** - Service worker and caching strategies
- **Sharp** - Image optimization

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
soundwave-pwa/
├── public/                 # Static assets
│   ├── icons/             # PWA icons (various sizes)
│   ├── manifest.json      # PWA manifest
│   └── favicon.ico        # App favicon
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── AudioPlayer.tsx
│   │   ├── AudioUpload.tsx
│   │   ├── PlaybackControls.tsx
│   │   ├── Playlist.tsx
│   │   └── TrackInfo.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAudioPlayer.ts
│   │   └── useAudioUpload.ts
│   ├── pages/            # Page components
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── assets/           # Static assets (images, etc.)
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # App entry point
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🎵 Usage

### Basic Audio Playback
1. **Upload audio files** using the upload button
2. **Select tracks** from the playlist
3. **Control playback** with the media controls
4. **Adjust volume** using the volume slider
5. **Seek through tracks** by clicking the progress bar

### Playlist Management
- **Add tracks** by uploading audio files
- **Reorder tracks** by dragging in the playlist
- **Remove tracks** with the delete button
- **View track details** including duration and metadata

### PWA Features
- **Install the app** for offline access
- **Use in standalone mode** without browser UI
- **Automatic updates** when new versions are available

## 🔧 Configuration

### PWA Settings
Edit `vite.config.ts` to customize PWA behavior:
- App name and description
- Theme colors
- Icon sizes and purposes
- Caching strategies

### Audio Settings
Modify `src/hooks/useAudioPlayer.ts` for:
- Default volume levels
- Audio format support
- Playback behavior

### Styling
Update `tailwind.config.ts` for:
- Custom color schemes
- Animation settings
- Responsive breakpoints

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on every push
3. Enjoy global CDN and automatic HTTPS

### Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Configure redirects for SPA routing

### GitHub Pages
1. Build the project: `npm run build`
2. Push the `dist` folder to a `gh-pages` branch
3. Enable GitHub Pages in repository settings

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Test on multiple devices and browsers
- Ensure PWA functionality works offline
- Maintain responsive design principles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Radix UI** for accessible primitives
- **Vite** for the excellent development experience
- **Tailwind CSS** for the utility-first approach
- **React** team for the amazing framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/soundwave-pwa/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/soundwave-pwa/discussions)
- **Email**: your.email@example.com

---

**Made with ❤️ and 🎵 by the SoundWave team**