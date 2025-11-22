<<<<<<< HEAD
# MindGuard 2.0 - Mental Health Support App for LSPU

A comprehensive mental health support application designed for LSPU (Laguna State Polytechnic University) students, featuring AI-powered chat, mood tracking, peer support groups, and counselor booking.

## ⚠️ Security Notice

**This is a local demo application.** Data is stored in the browser's localStorage and is **not encrypted or secured**. This implementation is for demonstration purposes only.

**For production use, you MUST:**
- Implement server-side authentication and data storage
- Use proper encryption (AES-256) for sensitive data
- Implement JWT-based sessions instead of localStorage
- Add server-side validation and rate limiting
- Comply with HIPAA-like privacy standards for mental health data
- Use HTTPS-only connections
- Implement proper access controls and audit logging

## Features

### Core Functionality
- **User Authentication**: Sign up and login with LSPU email validation
- **Mood Tracking**: Daily mood logging with visual history
- **AI Chat**: Empathetic AI assistant for mental health support
- **Crisis Detection**: Automatic detection of crisis language with emergency resources
- **Peer Support Groups**: Join anonymous student-led support groups
- **Counselor Booking**: Schedule appointments with LSPU counselors
- **Breathing Exercises**: 4-7-8 breathing technique for anxiety relief

### Security Enhancements
- ✅ DOMPurify for XSS protection
- ✅ Input sanitization and validation
- ✅ Password strength requirements
- ✅ Rate limiting (client-side simulation)
- ✅ Security disclaimers
- ✅ Encryption utilities (Web Crypto API) - ready for implementation

### User Experience
- ✅ Toast notifications (replaces disruptive alerts)
- ✅ Loading spinners for async operations
- ✅ Onboarding/guided tour for new users
- ✅ Dark mode support
- ✅ Search/filter for mood history
- ✅ Better crisis handling with multiple hotline options

### Accessibility (A11y)
- ✅ Skip links for keyboard navigation
- ✅ Comprehensive ARIA labels
- ✅ Semantic HTML elements
- ✅ Keyboard navigation support
- ✅ High contrast mode support
- ✅ Screen reader friendly
- ✅ Focus management

### Additional Features
- ✅ Data export (JSON format)
- ✅ Account deletion
- ✅ Emergency contacts management
- ✅ Location sharing (with consent)
- ✅ Service Worker for offline support
- ✅ Theme customization (light/dark)

## Setup Instructions

1. **Clone or download** this repository
2. **Open `mindguard.html`** in a modern web browser
3. **For offline support**, ensure `sw.js` is in the same directory
4. **For production**, deploy to a web server with HTTPS

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires JavaScript enabled
- Service Worker requires HTTPS (or localhost for development)

## Architecture

### File Structure
```
minguard/
├── mindguard.html    # Main application (single-page app)
├── sw.js            # Service Worker for offline support
└── README.md        # This file
```

### Data Storage
- **Current**: Browser localStorage (not secure for production)
- **Recommended**: Backend database (MongoDB, PostgreSQL) with encryption

### Key Technologies
- Vanilla JavaScript (ES6+)
- DOMPurify for XSS protection
- Web Crypto API for encryption utilities
- Font Awesome for icons
- Service Workers for offline support

## Security Considerations

### Current Limitations
1. **Client-side only**: No server-side validation
2. **localStorage**: Vulnerable to XSS attacks
3. **No encryption**: Data stored in plain text (except passwords which are hashed)
4. **No session management**: Sessions stored in localStorage

### Recommended Improvements
1. **Backend API**: Node.js/Express with MongoDB/PostgreSQL
2. **JWT Authentication**: Secure token-based sessions
3. **Server-side validation**: Validate all inputs on the server
4. **Encryption**: Encrypt sensitive data at rest and in transit
5. **Rate limiting**: Implement server-side rate limiting
6. **Audit logging**: Log all access and modifications
7. **HTTPS only**: Enforce secure connections

## Usage

### For Users
1. Start anonymously or create an account
2. Log your mood daily
3. Chat with the AI assistant
4. Join peer support groups
5. Book counseling sessions
6. Use breathing exercises when anxious

### For Developers
- All code is in `mindguard.html`
- Functions are organized by feature
- Storage keys are versioned (e.g., `mindguard_users_v2`)
- Debug API available: `window.MindGuard`

## Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Mood logging and history
- [ ] AI chat functionality
- [ ] Crisis detection
- [ ] Group joining
- [ ] Counselor booking
- [ ] Breathing exercises
- [ ] Dark mode toggle
- [ ] Data export
- [ ] Emergency contacts
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

### Recommended Testing Tools
- **Lighthouse**: Accessibility and performance audit
- **WAVE**: Web accessibility evaluation
- **OWASP ZAP**: Security vulnerability scanning
- **NVDA/JAWS**: Screen reader testing

## Deployment

### Development
- Open `mindguard.html` directly in browser
- Service Worker requires local server (e.g., `python -m http.server`)

### Production
1. Deploy to HTTPS-enabled hosting (Vercel, Netlify, etc.)
2. Ensure `sw.js` is accessible
3. Add Content Security Policy headers
4. Implement backend API (recommended)
5. Set up monitoring and error tracking

## Contributing

This is a student project. Contributions welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please ensure compliance with data protection laws (e.g., GDPR, HIPAA) before using in production.

## Resources

### Mental Health Hotlines
- **National Suicide Prevention Hotline**: 0966-725-5961
- **Crisis Text Line**: Text 741741
- **Emergency Services**: 911

### External Resources
- [SAMHSA](https://www.samhsa.gov/)
- [Mental Health America](https://www.mhanational.org/)

## Future Enhancements

- [ ] Server-side backend implementation
- [ ] Real AI integration (OpenAI GPT)
- [ ] Push notifications
- [ ] Journaling feature
- [ ] Mood prediction based on history
- [ ] Admin dashboard for counselors
- [ ] Multi-language support (Filipino/English)
- [ ] Integration with external mental health apps

## Support

For issues or questions:
- Check the code comments in `mindguard.html`
- Review browser console for errors
- Ensure all dependencies are loaded

---

**Remember**: This is a demo application. For production use with real user data, implement proper security measures and comply with applicable privacy laws.

=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
>>>>>>> 4cb2037be4339485a2d7720527dcb91bc680075f
