# Cliente ligero - Juego Estrategia

Este cliente es un prototipo minimal en HTML + Vanilla JS que consume la API del backend en `http://localhost:3000`.

Instrucciones:

1. Inicia el backend:

```bash
cd backend
npm install
npm run dev
```

2. Sirve los archivos estáticos. Con Python simple server:

```bash
cd client
python3 -m http.server 5173
# Luego abre http://localhost:5173
```

3. Usos:
- "Crear partida" -> llama `POST /games`
- Rellenar `Game ID` y usar "Cargar partida"
- Crear ejércitos, enviar órdenes, ejecutar ticks, guardar estado

