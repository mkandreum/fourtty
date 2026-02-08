<div align="center">
  <img width="1200" height="475" alt="Twentty Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 Twentty - La Red Social del Mañana

**Twentty** es una plataforma social moderna, elegante y ultra-fluida diseñada para conectar personas con un estilo visual premium y una experiencia de usuario excepcional. Inspirada en la nostalgia de las redes clásicas pero impulsada por tecnología de vanguardia.

---

## 🌟 Características Principales

### 📱 Experiencia Móvil de Calidad
- **PWA (Progressive Web App):** Instala Twentty en tu teléfono como una aplicación nativa.
- **Optimización Mobile-First:** Adaptabilidad total y gestos táctiles fluidos.
- **Teclado Inteligente:** Interfaz de chat que se ajusta automáticamente al teclado móvil para nunca perder de vista la conversación.

### 💬 Comunicación en Tiempo Real
- **Chat Instantáneo:** WebSocket con Socket.io para mensajes sin esperas.
- **Confirmaciones de Lectura:** Sistema de doble check (único para enviado, doble para leído).
- **Indicadores de Actividad:** Mira quién está online y quién está escribiendo en tiempo real.

### 📸 Contenido y Social
- **Feed Dinámico:** Novedades con soporte para textos, fotos y vídeos de YouTube.
- **Galería de Fotos:** Sube tus mejores momentos y etiqueta a tus amigos.
- **Estados vs Bio:** Diferencia entre tu biografía permanente y lo que estás pensando en este momento.
- **Sistema de Eventos:** Crea eventos, confirma asistencia y gestiona invitados.

### 🎨 Diseño y Estética
- **Modo Oscuro/Limpio:** Cambia entre temas con un solo clic.
- **Estética Glassmorphism:** Interfaces translúcidas y degradados vibrantes que "saltan" a la vista.
- **Micro-animaciones:** Transiciones suaves con Framer Motion para una sensación de fluidez total.

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con **Vite** para máxima velocidad.
- **Tailwind CSS** + Custom CSS para un estilo a medida.
- **Lucide React** para iconografía minimalista.
- **Framer Motion** para animaciones premium.

### Backend
- **Node.js** & **Express**.
- **Prisma ORM** con **SQLite** (fácil despliegue y portabilidad).
- **Socket.io** para interactividad en tiempo real.
- **JWT** para autenticación segura.

---

## 🚀 Instalación y Uso Local

### 1️⃣ Clonar y Preparar el Backend
```bash
cd backend
npm install
# Copia .env.example a .env y configura tu DATABASE_URL y JWT_SECRET
npx prisma migrate dev
npm run dev
```

### 2️⃣ Preparar el Frontend
```bash
cd frontend
npm install
# Configura VITE_API_URL en tu .env si es necesario
npm run dev
```

---

## 🔒 Seguridad y Privacidad
- Perfiles públicos, solo amigos o privados.
- Autenticación robusta basada en tokens.
- Sistema de invitaciones exclusivo para controlar el crecimiento de la comunidad.

---

<div align="center">
  <p>Desarrollado con ❤️ para la comunidad de <b>Twentty</b>.</p>
</div>
