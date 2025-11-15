# Configuración del Panel de Administración

## 🚀 Configuración Inicial

### 1. Base de Datos (Prisma)

1. Configura tu base de datos PostgreSQL y agrega la URL en `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/total_furnish?schema=public"
```

2. Ejecuta las migraciones:
```bash
npm run db:push
```

3. Crea el usuario admin inicial:
```bash
npm run db:seed
```

**Credenciales por defecto:**
- Email: `admin@habitastudio.online`
- Password: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión.

### 2. Cloudinary

1. Crea una cuenta en [Cloudinary](https://cloudinary.com)
2. Obtén tus credenciales del Dashboard
3. Crea un Upload Preset (Settings → Upload → Upload presets)
4. Agrega las variables en `.env`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="tu-upload-preset"
```

### 3. JWT Secret

Genera un secreto seguro para JWT:
```env
JWT_SECRET="tu-secreto-super-seguro-aqui"
```

## 📋 Uso del Panel de Administración

### Acceso
1. Ve a `/admin/login`
2. Inicia sesión con tus credenciales
3. Serás redirigido al dashboard

### Funcionalidades

#### Productos
- **Ver todos**: `/admin/products`
- **Crear nuevo**: `/admin/products/new`
- **Editar**: `/admin/products/[id]`
- **Eliminar**: Botón de eliminar en la tabla

#### Servicios
- **Ver todos**: `/admin/services`
- **Crear nuevo**: `/admin/services/new`
- **Editar**: `/admin/services/[id]`
- **Eliminar**: Botón de eliminar en la tabla

#### Proyectos
- **Ver todos**: `/admin/projects`
- **Crear nuevo**: `/admin/projects/new`
- **Editar**: `/admin/projects/[id]`
- **Eliminar**: Botón de eliminar en la tabla

### Subida de Imágenes

El panel usa Cloudinary para gestionar imágenes:
- **Imagen única**: Usa el componente `ImageUpload`
- **Galería múltiple**: Usa el componente `MultiImageUpload`
- Las imágenes se organizan en carpetas:
  - `habita-studio/products` - Productos
  - `habita-studio/projects` - Proyectos

### Características

- ✅ Autenticación segura con JWT
- ✅ Validación de formularios con Zod
- ✅ Subida de imágenes con Cloudinary
- ✅ Server Actions para operaciones CRUD
- ✅ Revalidación automática de caché
- ✅ Interfaz intuitiva y profesional
- ✅ Responsive design

## 🔒 Seguridad

- Todas las acciones requieren autenticación
- Solo usuarios con rol "admin" pueden acceder
- Las contraseñas se hashean con bcrypt
- Las sesiones se gestionan con JWT en cookies httpOnly

## 📝 Notas

- Los cambios se reflejan automáticamente en el sitio público
- Las imágenes se optimizan automáticamente por Cloudinary
- El slug se genera automáticamente desde el título/nombre

