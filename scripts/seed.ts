import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all existing data...");
  
  // Eliminar todos los datos existentes en orden (respetando foreign keys)
  await prisma.quoteItem.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.quoteSequence.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log("All existing data deleted.");

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash("hspass#2025michael", 10);
  
  const admin = await prisma.user.create({
    data: {
      email: "info@habitastudio.online",
      name: "Michael Valerio",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("Admin user created:", admin.email);

  // Productos
  // Precios en CRC (colones costarricenses)
  const products = [
    {
      name: "Sofá Moderno de 3 Plazas",
      slug: "sofa-moderno-3-plazas",
      category: "Salas",
      cost: 500000,
      price: 715000,
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      description: "Sofá elegante y cómodo con diseño contemporáneo. Perfecto para espacios modernos, fabricado con materiales de alta calidad y tapizado en tela premium.",
      features: ["Estructura de madera sólida", "Tapizado en tela premium", "Almohadas incluidas", "Diseño moderno y elegante", "Fácil mantenimiento"],
      material: "Madera sólida, tela premium",
      dimensions: "220cm x 95cm x 85cm",
      color: "Gris, Beige, Azul marino",
      warranty: "2 años",
    },
    {
      name: "Mesa de Comedor Extensible",
      slug: "mesa-comedor-extensible",
      category: "Comedores",
      cost: 350000,
      price: 495000,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      description: "Mesa de comedor extensible con capacidad para 6-10 personas. Diseño elegante en madera maciza con acabado natural.",
      features: ["Extensible hasta 280cm", "Madera maciza de roble", "Base robusta de metal", "Fácil de limpiar", "Diseño atemporal"],
      material: "Madera de roble maciza, acero",
      dimensions: "200cm x 100cm x 75cm (extendida: 280cm)",
      color: "Natural, Nogal, Blanco",
      warranty: "3 años",
    },
    {
      name: "Juego de Sillas de Comedor",
      slug: "juego-sillas-comedor",
      category: "Comedores",
      cost: 240000,
      price: 330000,
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
      description: "Set de 6 sillas de comedor con diseño ergonómico y estilo moderno. Asientos acolchados para máxima comodidad.",
      features: ["Set de 6 sillas", "Asientos acolchados", "Diseño ergonómico", "Fácil de apilar", "Resistente y duradero"],
      material: "Madera de pino, tela acolchada",
      dimensions: "45cm x 50cm x 95cm",
      color: "Gris, Beige, Negro",
      warranty: "2 años",
    },
    {
      name: "Cama King Size con Base",
      slug: "cama-king-size-base",
      category: "Dormitorios",
      cost: 630000,
      price: 880000,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      description: "Cama king size con base integrada y cabecero acolchado. Diseño elegante que transforma tu dormitorio.",
      features: ["Tamaño King (200x200cm)", "Base integrada con almacenamiento", "Cabecero acolchado", "Diseño moderno", "Fácil montaje"],
      material: "Madera MDF, tela acolchada",
      dimensions: "200cm x 200cm x 120cm",
      color: "Gris, Beige, Azul marino",
      warranty: "5 años",
    },
    {
      name: "Escritorio Ejecutivo Moderno",
      slug: "escritorio-ejecutivo-moderno",
      category: "Oficinas",
      cost: 315000,
      price: 440000,
      image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      description: "Escritorio ejecutivo amplio con cajones y estantería integrada. Perfecto para espacios de trabajo profesionales.",
      features: ["Superficie amplia", "3 cajones con llave", "Estantería superior", "Cable management", "Diseño profesional"],
      material: "Madera MDF, acero",
      dimensions: "160cm x 70cm x 140cm",
      color: "Nogal, Blanco, Negro",
      warranty: "3 años",
    },
    {
      name: "Isla de Cocina con Barra",
      slug: "isla-cocina-barra",
      category: "Cocinas",
      cost: 750000,
      price: 1045000,
      image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
      description: "Isla de cocina con barra desayunadora. Espacio adicional de trabajo y almacenamiento con diseño contemporáneo.",
      features: ["Barra desayunadora", "Almacenamiento amplio", "Encimera de cuarzo", "4 taburetes incluidos", "Diseño personalizable"],
      material: "Madera MDF, cuarzo, acero inoxidable",
      dimensions: "200cm x 100cm x 90cm",
      color: "Blanco, Gris, Nogal",
      warranty: "5 años",
    },
    {
      name: "Sofá Cama Convertible",
      slug: "sofa-cama-convertible",
      category: "Salas",
      cost: 420000,
      price: 605000,
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      description: "Sofá cama convertible de 3 plazas. Perfecto para espacios pequeños que necesitan versatilidad.",
      features: ["Convierte en cama doble", "Mecanismo fácil de usar", "Colchón incluido", "Diseño compacto", "Múltiples usos"],
      material: "Madera, espuma de alta densidad",
      dimensions: "200cm x 95cm x 85cm (cama: 200cm x 140cm)",
      color: "Gris, Beige, Azul",
      warranty: "2 años",
    },
    {
      name: "Mesa de Centro con Almacenamiento",
      slug: "mesa-centro-almacenamiento",
      category: "Salas",
      cost: 160000,
      price: 220000,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      description: "Mesa de centro moderna con cajones y estante inferior. Combina estilo y funcionalidad.",
      features: ["2 cajones espaciosos", "Estante inferior", "Diseño moderno", "Fácil de mover", "Múltiples acabados"],
      material: "Madera MDF, metal",
      dimensions: "120cm x 60cm x 45cm",
      color: "Nogal, Blanco, Gris",
      warranty: "2 años",
    },
    {
      name: "Armario Empotrado 3 Puertas",
      slug: "armario-empotrado-3-puertas",
      category: "Dormitorios",
      cost: 590000,
      price: 825000,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      description: "Armario empotrado de 3 puertas con sistema de organización interior. Máximo aprovechamiento del espacio.",
      features: ["3 puertas correderas", "Interior organizable", "Espejo en una puerta", "Sistema de iluminación LED", "Diseño personalizable"],
      material: "Madera MDF, espejo, LED",
      dimensions: "240cm x 60cm x 240cm",
      color: "Blanco, Gris, Nogal",
      warranty: "5 años",
    },
    {
      name: "Silla Ergonómica de Oficina",
      slug: "silla-ergonomica-oficina",
      category: "Oficinas",
      cost: 200000,
      price: 275000,
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
      description: "Silla ergonómica de oficina con soporte lumbar ajustable. Diseñada para largas jornadas de trabajo.",
      features: ["Soporte lumbar ajustable", "Reposabrazos regulables", "Altura ajustable", "Ruedas silenciosas", "Respaldo reclinable"],
      material: "Malla transpirable, acero, plástico",
      dimensions: "65cm x 65cm x 120cm",
      color: "Negro, Gris, Azul",
      warranty: "3 años",
    },
    {
      name: "Estantería Modular 5 Niveles",
      slug: "estanteria-modular-5-niveles",
      category: "Salas",
      cost: 240000,
      price: 330000,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      description: "Estantería modular de 5 niveles con diseño abierto. Perfecta para organizar libros, decoración y objetos personales.",
      features: ["5 niveles espaciosos", "Diseño abierto", "Fácil de montar", "Modular y expandible", "Múltiples usos"],
      material: "Madera MDF",
      dimensions: "180cm x 30cm x 200cm",
      color: "Nogal, Blanco, Gris",
      warranty: "2 años",
    },
    {
      name: "Mesa de Noche con USB",
      slug: "mesa-noche-usb",
      category: "Dormitorios",
      cost: 120000,
      price: 165000,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      description: "Mesa de noche moderna con puerto USB integrado y cajón. Diseño funcional y elegante.",
      features: ["Puerto USB integrado", "Cajón con llave", "Diseño moderno", "Fácil acceso", "Múltiples acabados"],
      material: "Madera MDF, metal",
      dimensions: "50cm x 40cm x 60cm",
      color: "Nogal, Blanco, Gris",
      warranty: "2 años",
    },
  ];

  console.log("Creating products...");
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }
  console.log(`Created ${products.length} products`);

  // Servicios
  const services = [
    {
      slug: "diseno-interiores",
      title: "Diseño de Interiores",
      description: "Creamos espacios únicos que combinan funcionalidad y estética, adaptados a tu estilo de vida.",
      longDescription: "Nuestro servicio de diseño de interiores transforma tus espacios en lugares que reflejan tu personalidad y necesidades. Trabajamos contigo desde la conceptualización hasta la ejecución, creando ambientes únicos y funcionales que mejoran tu calidad de vida. Utilizamos las últimas tendencias en diseño y materiales de alta calidad para garantizar resultados excepcionales.",
      features: ["Consultoría de diseño personalizada", "Planeación y visualización 3D", "Selección de materiales y acabados", "Coordinación de proyectos", "Asesoría en iluminación"],
      process: ["Consulta inicial y análisis de necesidades", "Desarrollo de concepto y propuesta de diseño", "Selección de mobiliario y decoración", "Supervisión de la implementación", "Entrega final y seguimiento"],
      benefits: ["Optimización del espacio", "Ambientes personalizados", "Aumento del valor de la propiedad", "Ahorro de tiempo y estrés", "Resultados profesionales"],
      icon: "Home",
    },
    {
      slug: "remodelacion-cocinas",
      title: "Remodelación de Cocinas",
      description: "Transformamos tu cocina en un espacio moderno, funcional y acogedor con los mejores materiales y diseño.",
      longDescription: "Especialistas en remodelación integral de cocinas. Desde la planificación hasta la instalación final, nos encargamos de cada detalle. Trabajamos con gabinetes a medida, encimeras de cuarzo y granito, electrodomésticos de última generación y sistemas de iluminación LED. Creamos cocinas que combinan funcionalidad, estética y eficiencia energética.",
      features: ["Diseño personalizado", "Gabinetes a medida", "Instalación de electrodomésticos", "Encimeras de cuarzo/granito", "Sistemas de iluminación LED"],
      process: ["Diseño y planificación", "Demolición y preparación", "Instalación eléctrica y plomería", "Instalación de gabinetes y encimeras", "Acabados finales y limpieza"],
      benefits: ["Mayor funcionalidad", "Valor agregado a tu hogar", "Eficiencia energética", "Espacio optimizado", "Diseño moderno y atemporal"],
      icon: "ChefHat",
    },
    {
      slug: "remodelacion-banos",
      title: "Remodelación de Baños",
      description: "Renovamos tu baño con diseño moderno, materiales de calidad y acabados de lujo.",
      longDescription: "Transformamos baños antiguos en espacios modernos y funcionales. Especialistas en instalación de azulejos, sanitarios, grifería moderna, duchas a medida y sistemas de almacenamiento. Utilizamos materiales resistentes a la humedad y técnicas de instalación profesionales para garantizar durabilidad y estética.",
      features: ["Diseño personalizado", "Instalación de azulejos", "Sanitarios modernos", "Grifería de alta calidad", "Sistemas de almacenamiento"],
      process: ["Diseño y planificación", "Demolición", "Instalación de plomería y electricidad", "Instalación de azulejos y sanitarios", "Acabados y limpieza"],
      benefits: ["Espacio renovado", "Mayor funcionalidad", "Valor agregado", "Diseño moderno", "Materiales duraderos"],
      icon: "Droplet",
    },
    {
      slug: "muebles-medida",
      title: "Muebles a la Medida",
      description: "Fabricamos muebles personalizados que se adaptan perfectamente a tus espacios y necesidades.",
      longDescription: "Creamos muebles únicos diseñados específicamente para tu hogar u oficina. Trabajamos con diferentes materiales como madera maciza, MDF, melamina y acero. Desde armarios empotrados hasta escritorios personalizados, cada pieza se fabrica con precisión y atención al detalle para garantizar el ajuste perfecto y máxima funcionalidad.",
      features: ["Diseño personalizado", "Medición precisa", "Múltiples materiales", "Fabricación artesanal", "Instalación profesional"],
      process: ["Consulta y medición", "Diseño y aprobación", "Fabricación", "Acabados y barnizado", "Instalación"],
      benefits: ["Aprovechamiento del espacio", "Diseño único", "Calidad artesanal", "Durabilidad", "Valor agregado"],
      icon: "Hammer",
    },
    {
      slug: "pintura-acabados",
      title: "Pintura y Acabados",
      description: "Servicio profesional de pintura interior y exterior con acabados de alta calidad.",
      longDescription: "Ofrecemos servicios completos de pintura para interiores y exteriores. Utilizamos pinturas de primera calidad, técnicas profesionales de preparación de superficies y acabados especiales. Desde pintura básica hasta efectos decorativos, texturas y murales personalizados.",
      features: ["Preparación de superficies", "Pintura de calidad premium", "Acabados especiales", "Texturas y efectos", "Limpieza profesional"],
      process: ["Protección de áreas", "Preparación de superficies", "Aplicación de imprimación", "Aplicación de pintura", "Acabados y limpieza"],
      benefits: ["Espacios renovados", "Protección de superficies", "Estética mejorada", "Durabilidad", "Valor agregado"],
      icon: "Paintbrush",
    },
    {
      slug: "iluminacion-led",
      title: "Instalación de Iluminación LED",
      description: "Sistemas de iluminación LED modernos, eficientes y personalizados para cada espacio.",
      longDescription: "Especialistas en diseño e instalación de sistemas de iluminación LED. Desde iluminación general hasta iluminación decorativa y funcional. Ofrecemos soluciones inteligentes con control remoto, dimmers y sistemas de automatización para crear ambientes perfectos en cada momento del día.",
      features: ["Diseño de iluminación", "Instalación profesional", "Sistemas inteligentes", "Control remoto", "Eficiencia energética"],
      process: ["Análisis de necesidades", "Diseño del sistema", "Instalación eléctrica", "Instalación de luminarias", "Configuración y prueba"],
      benefits: ["Ahorro energético", "Ambientes personalizables", "Mayor durabilidad", "Tecnología moderna", "Valor agregado"],
      icon: "Lightbulb",
    },
    {
      slug: "pisos-laminados",
      title: "Instalación de Pisos Laminados",
      description: "Instalación profesional de pisos laminados, vinílicos y de ingeniería con garantía.",
      longDescription: "Instalamos diferentes tipos de pisos incluyendo laminados, vinílicos de lujo (LVT), pisos de ingeniería y pisos flotantes. Trabajamos con las mejores marcas y ofrecemos garantía en la instalación. Preparación adecuada de la superficie, instalación precisa y acabados profesionales.",
      features: ["Múltiples opciones de materiales", "Preparación de superficie", "Instalación profesional", "Acabados y molduras", "Garantía de instalación"],
      process: ["Evaluación de superficie", "Preparación y nivelación", "Instalación del piso", "Instalación de molduras", "Limpieza y acabados"],
      benefits: ["Durabilidad", "Fácil mantenimiento", "Estética moderna", "Aislamiento acústico", "Valor agregado"],
      icon: "Square",
    },
    {
      slug: "closets-organizacion",
      title: "Closets y Organización",
      description: "Sistemas de organización y closets personalizados para maximizar el espacio y funcionalidad.",
      longDescription: "Diseñamos e instalamos sistemas de organización completos para closets, despensas y áreas de almacenamiento. Utilizamos sistemas modulares con estantes, cajones, colgadores y accesorios personalizados. Cada diseño se adapta a tus necesidades específicas y al espacio disponible.",
      features: ["Diseño personalizado", "Sistemas modulares", "Múltiples accesorios", "Instalación profesional", "Máxima organización"],
      process: ["Medición y análisis", "Diseño del sistema", "Fabricación de componentes", "Instalación", "Organización final"],
      benefits: ["Máximo aprovechamiento del espacio", "Organización eficiente", "Fácil acceso", "Estética mejorada", "Valor agregado"],
      icon: "Shirt",
    },
    {
      slug: "techos-falsos",
      title: "Techos Falsos y Drywall",
      description: "Instalación de techos falsos, drywall y divisiones para optimizar espacios y mejorar la acústica.",
      longDescription: "Especialistas en construcción en seco con drywall. Instalamos techos falsos, divisiones, muros y estructuras personalizadas. Trabajamos con diferentes tipos de placas, aislantes acústicos y térmicos. Soluciones rápidas, limpias y eficientes para cualquier proyecto.",
      features: ["Construcción en seco", "Techos falsos", "Divisiones y muros", "Aislamiento acústico", "Instalación rápida"],
      process: ["Diseño y planificación", "Instalación de estructura", "Instalación de placas", "Acabados y texturas", "Pintura final"],
      benefits: ["Instalación rápida", "Aislamiento mejorado", "Flexibilidad de diseño", "Limpieza en obra", "Costo efectivo"],
      icon: "Layers",
    },
    {
      slug: "carpinteria-fina",
      title: "Carpintería Fina",
      description: "Trabajos de carpintería fina con atención al detalle y acabados de alta calidad.",
      longDescription: "Realizamos trabajos de carpintería fina incluyendo molduras, zoclos, marcos de puertas, ventanas, escaleras y trabajos especiales. Utilizamos maderas de calidad y técnicas tradicionales combinadas con herramientas modernas para lograr acabados excepcionales.",
      features: ["Trabajos personalizados", "Maderas de calidad", "Acabados finos", "Instalación profesional", "Garantía de calidad"],
      process: ["Consulta y diseño", "Selección de materiales", "Fabricación", "Acabados", "Instalación"],
      benefits: ["Calidad artesanal", "Diseño único", "Durabilidad", "Valor agregado", "Acabados excepcionales"],
      icon: "Wrench",
    },
    {
      slug: "jardines-terrazas",
      title: "Diseño de Jardines y Terrazas",
      description: "Diseño y construcción de jardines, terrazas y espacios exteriores funcionales y hermosos.",
      longDescription: "Creamos espacios exteriores que se integran perfectamente con tu hogar. Desde jardines verticales hasta terrazas con deck, pergolas y áreas de entretenimiento. Utilizamos plantas nativas, sistemas de riego eficientes y materiales duraderos para exteriores.",
      features: ["Diseño paisajístico", "Instalación de deck", "Pérgolas y estructuras", "Sistemas de riego", "Iluminación exterior"],
      process: ["Diseño del espacio", "Preparación del terreno", "Instalación de estructuras", "Plantación", "Acabados finales"],
      benefits: ["Espacios exteriores funcionales", "Valor agregado", "Ambiente relajante", "Bajo mantenimiento", "Diseño personalizado"],
      icon: "TreePine",
    },
  ];

  console.log("Creating services...");
  for (const service of services) {
    await prisma.service.create({
      data: service,
    });
  }
  console.log(`Created ${services.length} services`);

  // Proyectos
  const projects = [
    {
      slug: "remodelacion-cocina-moderna",
      title: "Remodelación de Cocina Moderna",
      description: "Transformación completa de cocina con diseño contemporáneo, isla central y acabados de alta gama.",
      longDescription: "Este proyecto implicó la remodelación integral de una cocina de 25m², creando un espacio moderno y funcional. Se instaló una isla central con encimera de cuarzo, gabinetes a medida en color blanco mate, electrodomésticos de última generación y sistema de iluminación LED integrado. La distribución optimizada permite un flujo de trabajo eficiente mientras mantiene un diseño elegante y atemporal.",
      image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
        "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
      ],
      category: "Remodelación",
      year: "2024",
      location: "San José",
      duration: "8 semanas",
      challenges: ["Optimización de espacio en cocina pequeña", "Integración de electrodomésticos inteligentes", "Mantenimiento de estructura existente"],
      solutions: ["Diseño de gabinetes a medida para maximizar almacenamiento", "Instalación de sistema domótico para control de iluminación y electrodomésticos", "Refuerzo estructural sin modificar la estructura principal"],
    },
    {
      slug: "apartamento-minimalista",
      title: "Apartamento Minimalista",
      description: "Renovación completa de apartamento de 60m² con diseño minimalista y funcional.",
      longDescription: "Proyecto de renovación integral de un apartamento pequeño con enfoque en maximizar el espacio y crear ambientes luminosos. Se eliminaron divisiones innecesarias, se instaló piso laminado en toda la unidad, se renovó la cocina y el baño, y se diseñó mobiliario a medida para aprovechar cada centímetro. El resultado es un espacio moderno, funcional y acogedor.",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      ],
      category: "Renovación",
      year: "2024",
      location: "Heredia",
      duration: "10 semanas",
      challenges: ["Espacio limitado", "Presupuesto ajustado", "Múltiples áreas a renovar"],
      solutions: ["Diseño open space para maximizar sensación de amplitud", "Selección de materiales económicos pero de calidad", "Planificación detallada para optimizar tiempos y costos"],
    },
    {
      slug: "oficina-corporativa",
      title: "Oficina Corporativa Moderna",
      description: "Diseño e implementación de oficina corporativa con espacios colaborativos y privados.",
      longDescription: "Proyecto completo de diseño e implementación de oficina corporativa de 200m². Se crearon espacios colaborativos abiertos, salas de reuniones privadas, área de descanso y oficinas ejecutivas. Se utilizó mobiliario ergonómico, sistemas de iluminación LED inteligente y acabados modernos que reflejan la identidad corporativa del cliente.",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      ],
      category: "Comercial",
      year: "2024",
      location: "Alajuela",
      duration: "12 semanas",
      challenges: ["Múltiples espacios funcionales", "Presupuesto corporativo", "Plazos ajustados"],
      solutions: ["Diseño modular y escalable", "Coordinación eficiente con proveedores", "Trabajo en etapas para minimizar interrupciones"],
    },
    {
      slug: "casa-familiar-completa",
      title: "Remodelación Casa Familiar Completa",
      description: "Renovación integral de casa de 180m² incluyendo cocina, baños, salas y dormitorios.",
      longDescription: "Proyecto ambicioso de renovación completa de una casa familiar. Se renovaron 3 baños, la cocina, sala, comedor y 4 dormitorios. Se instalaron pisos laminados en toda la casa, se renovó la pintura interior y exterior, se instalaron closets a medida en todos los dormitorios y se renovó completamente la iluminación con sistemas LED. El resultado es una casa completamente renovada y moderna.",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
      ],
      category: "Remodelación",
      year: "2023",
      location: "Cartago",
      duration: "16 semanas",
      challenges: ["Múltiples áreas simultáneas", "Vivir durante la obra", "Coordinación de múltiples especialistas"],
      solutions: ["Planificación por etapas", "Protección de áreas no en obra", "Coordinación diaria con el cliente"],
    },
    {
      slug: "restaurante-tematico",
      title: "Diseño de Restaurante Temático",
      description: "Diseño e implementación completa de restaurante temático con ambiente único y funcional.",
      longDescription: "Proyecto de diseño e implementación de restaurante temático de 150m². Se creó un ambiente único que combina elementos rústicos con toques modernos. Se diseñó la barra, área de comedor, cocina abierta y área de espera. Se utilizaron materiales naturales como madera y piedra, iluminación ambiental y mobiliario personalizado que refleja la identidad del restaurante.",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      ],
      category: "Comercial",
      year: "2024",
      location: "San José",
      duration: "14 semanas",
      challenges: ["Cumplir normativas de seguridad", "Diseño único y funcional", "Plazos de apertura"],
      solutions: ["Colaboración con arquitectos especializados", "Diseño iterativo con el cliente", "Coordinación estrecha con proveedores"],
    },
    {
      slug: "loft-industrial",
      title: "Loft de Estilo Industrial",
      description: "Conversión de espacio industrial en loft residencial moderno con diseño industrial.",
      longDescription: "Transformación de un espacio industrial de 120m² en un loft residencial moderno. Se mantuvieron elementos originales como vigas de acero y ladrillos expuestos, combinándolos con acabados modernos. Se crearon divisiones con drywall para áreas privadas, se instaló piso de concreto pulido, iluminación industrial y mobiliario moderno. El resultado es un espacio único que combina historia y modernidad.",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      ],
      category: "Renovación",
      year: "2023",
      location: "Heredia",
      duration: "12 semanas",
      challenges: ["Preservar elementos históricos", "Aislamiento térmico y acústico", "Instalaciones modernas en estructura antigua"],
      solutions: ["Restauración cuidadosa de elementos originales", "Aislamiento sin afectar estética", "Instalaciones ocultas pero accesibles"],
    },
    {
      slug: "sala-entretenimiento",
      title: "Sala de Entretenimiento",
      description: "Diseño e implementación de sala de entretenimiento con home theater y bar integrado.",
      longDescription: "Creación de una sala de entretenimiento completa de 40m² con home theater profesional, bar integrado, área de juegos y almacenamiento para vinos. Se instaló sistema de sonido envolvente, iluminación ambiental controlable, piso acústico y mobiliario personalizado. El espacio está completamente aislado acústicamente para una experiencia cinematográfica óptima.",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      ],
      category: "Interiores",
      year: "2024",
      location: "Alajuela",
      duration: "6 semanas",
      challenges: ["Aislamiento acústico completo", "Integración de tecnología", "Diseño funcional y estético"],
      solutions: ["Aislamiento multicapa", "Pre-cableado para tecnología", "Diseño que oculta tecnología sin sacrificar estética"],
    },
    {
      slug: "bano-lujo",
      title: "Baño de Lujo",
      description: "Remodelación completa de baño principal con acabados de lujo y diseño spa.",
      longDescription: "Transformación de baño estándar en un espacio tipo spa de lujo. Se instaló ducha a la italiana con sistema de lluvia, bañera independiente, vanitorio doble con encimera de mármol, sistema de almacenamiento integrado, iluminación LED ambiental y calefacción por piso radiante. Los acabados incluyen azulejos de porcelanato de alta gama y grifería de diseño.",
      image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
      ],
      category: "Remodelación",
      year: "2024",
      location: "San José",
      duration: "6 semanas",
      challenges: ["Espacio limitado", "Instalaciones complejas", "Materiales de lujo"],
      solutions: ["Diseño optimizado para espacio", "Coordinación con especialistas", "Selección cuidadosa de proveedores"],
    },
    {
      slug: "dormitorio-principal",
      title: "Dormitorio Principal con Walk-in Closet",
      description: "Renovación de dormitorio principal con walk-in closet integrado y baño privado.",
      longDescription: "Proyecto completo de renovación del dormitorio principal incluyendo walk-in closet de 12m², renovación del baño privado y diseño del área de descanso. Se instaló piso laminado, iluminación LED con dimmers, sistema de almacenamiento personalizado en el closet, y mobiliario a medida. El diseño crea un ambiente de lujo y funcionalidad.",
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      ],
      category: "Interiores",
      year: "2024",
      location: "Cartago",
      duration: "8 semanas",
      challenges: ["Integración de múltiples espacios", "Máximo almacenamiento", "Diseño cohesivo"],
      solutions: ["Diseño integral de todos los espacios", "Sistemas de organización personalizados", "Paleta de colores unificada"],
    },
    {
      slug: "terraza-jardin",
      title: "Terraza y Jardín",
      description: "Diseño e implementación de terraza con deck, pergola y área de jardín.",
      longDescription: "Creación de espacio exterior funcional con deck de madera, pergola con techo retráctil, área de jardín con plantas nativas, sistema de riego automático, iluminación LED exterior y mobiliario de exterior. El diseño integra perfectamente el espacio interior con el exterior, creando un área de entretenimiento y relajación.",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
      ],
      category: "Exteriores",
      year: "2024",
      location: "Heredia",
      duration: "10 semanas",
      challenges: ["Clima y exposición", "Mantenimiento de plantas", "Integración con estructura existente"],
      solutions: ["Materiales resistentes a intemperie", "Selección de plantas nativas de bajo mantenimiento", "Diseño que respeta estructura existente"],
    },
    {
      slug: "apartamento-estudio",
      title: "Apartamento Estudio Funcional",
      description: "Optimización de apartamento estudio de 35m² con diseño multifuncional.",
      longDescription: "Transformación de apartamento estudio pequeño en un espacio altamente funcional. Se crearon divisiones con muebles y cortinas, área de cocina integrada, espacio de trabajo plegable, cama con almacenamiento y sistema de organización completo. El diseño maximiza cada centímetro creando la ilusión de más espacio.",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      ],
      category: "Renovación",
      year: "2023",
      location: "San José",
      duration: "6 semanas",
      challenges: ["Espacio extremadamente limitado", "Múltiples funciones en un espacio", "Presupuesto ajustado"],
      solutions: ["Mobiliario multifuncional", "Diseño vertical para aprovechar altura", "Materiales económicos pero de calidad"],
    },
    {
      slug: "clinica-dental",
      title: "Clínica Dental Moderna",
      description: "Diseño e implementación de clínica dental con 4 consultorios y recepción.",
      longDescription: "Proyecto completo de diseño e implementación de clínica dental de 180m². Se diseñaron 4 consultorios completamente equipados, área de recepción, sala de espera, área de esterilización y oficina administrativa. Se utilizaron materiales fáciles de limpiar, iluminación clínica especializada y diseño que transmite confianza y profesionalismo.",
      image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800",
        "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800",
      ],
      category: "Comercial",
      year: "2024",
      location: "Alajuela",
      duration: "16 semanas",
      challenges: ["Cumplir normativas sanitarias", "Instalaciones especializadas", "Diseño funcional y estético"],
      solutions: ["Colaboración con especialistas médicos", "Materiales certificados", "Diseño que prioriza funcionalidad sin sacrificar estética"],
    },
  ];

  console.log("Creating projects...");
  for (const project of projects) {
    await prisma.project.create({
      data: project,
    });
  }
  console.log(`Created ${projects.length} projects`);

  // Cotizaciones
  const quotes = [
    {
      quoteNumber: `COT-${new Date().getFullYear()}-0001`,
      clientName: "María González",
      clientEmail: "maria.gonzalez@email.com",
      clientPhone: "+506 6364 4915",
      clientAddress: "San José, Barrio Escalante, Calle 25, Casa #45",
      projectName: "Remodelación de Cocina Completa",
      projectDescription: "Remodelación integral de cocina con diseño moderno, isla central y electrodomésticos de última generación.",
      status: "sent",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde ahora
      subtotal: 2500000,
      tax: 325000,
      discount: 0,
      total: 2825000,
      notes: "La cotización incluye materiales de primera calidad. Válida por 30 días. Se requiere anticipo del 30% para iniciar el proyecto.",
      items: [
        {
          description: "Diseño y planificación de cocina",
          quantity: 1,
          unitPrice: 150000,
          total: 150000,
        },
        {
          description: "Gabinetes a medida en melamina blanca mate",
          quantity: 1,
          unitPrice: 800000,
          total: 800000,
        },
        {
          description: "Encimera de cuarzo (3 metros lineales)",
          quantity: 3,
          unitPrice: 120000,
          total: 360000,
        },
        {
          description: "Isla central con barra desayunadora",
          quantity: 1,
          unitPrice: 450000,
          total: 450000,
        },
        {
          description: "Instalación de electrodomésticos (horno, cocina, campana)",
          quantity: 1,
          unitPrice: 200000,
          total: 200000,
        },
        {
          description: "Instalación eléctrica y plomería",
          quantity: 1,
          unitPrice: 180000,
          total: 180000,
        },
        {
          description: "Sistema de iluminación LED integrado",
          quantity: 1,
          unitPrice: 160000,
          total: 160000,
        },
        {
          description: "Mano de obra y acabados",
          quantity: 1,
          unitPrice: 200000,
          total: 200000,
        },
      ],
    },
    {
      quoteNumber: `COT-${new Date().getFullYear()}-0002`,
      clientName: "Carlos Rodríguez",
      clientEmail: "carlos.rodriguez@email.com",
      clientPhone: "+506 6364 4915",
      clientAddress: "Heredia, San Pablo, Avenida Central, Edificio Los Robles, Apt 302",
      projectName: "Remodelación de Baño Principal",
      projectDescription: "Renovación completa de baño principal con acabados de lujo y diseño moderno.",
      status: "accepted",
      validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      subtotal: 1800000,
      tax: 234000,
      discount: 90000,
      total: 1944000,
      notes: "Proyecto aceptado. Inicio programado para la próxima semana. Incluye materiales premium.",
      items: [
        {
          description: "Diseño y planificación de baño",
          quantity: 1,
          unitPrice: 80000,
          total: 80000,
        },
        {
          description: "Azulejos de porcelanato premium (paredes y piso)",
          quantity: 25,
          unitPrice: 15000,
          total: 375000,
        },
        {
          description: "Sanitarios modernos (inodoro y lavabo)",
          quantity: 1,
          unitPrice: 280000,
          total: 280000,
        },
        {
          description: "Ducha a la italiana con sistema de lluvia",
          quantity: 1,
          unitPrice: 350000,
          total: 350000,
        },
        {
          description: "Grifería de diseño premium",
          quantity: 1,
          unitPrice: 180000,
          total: 180000,
        },
        {
          description: "Vanitorio con encimera de mármol",
          quantity: 1,
          unitPrice: 320000,
          total: 320000,
        },
        {
          description: "Sistema de almacenamiento integrado",
          quantity: 1,
          unitPrice: 150000,
          total: 150000,
        },
        {
          description: "Instalación de plomería y electricidad",
          quantity: 1,
          unitPrice: 165000,
          total: 165000,
        },
      ],
    },
    {
      quoteNumber: `COT-${new Date().getFullYear()}-0003`,
      clientName: "Ana Martínez",
      clientEmail: "ana.martinez@email.com",
      clientPhone: "+506 6364 4915",
      clientAddress: "Cartago, Centro, Calle 5, Casa #12",
      projectName: "Muebles a la Medida para Sala",
      projectDescription: "Fabricación e instalación de muebles personalizados para sala de estar.",
      status: "draft",
      validUntil: null,
      subtotal: 1200000,
      tax: 156000,
      discount: 0,
      total: 1356000,
      notes: "Cotización en borrador. Pendiente aprobación de diseño final.",
      items: [
        {
          description: "Sofá de 3 plazas a medida",
          quantity: 1,
          unitPrice: 450000,
          total: 450000,
        },
        {
          description: "Mesa de centro con almacenamiento",
          quantity: 1,
          unitPrice: 180000,
          total: 180000,
        },
        {
          description: "Estantería modular de 5 niveles",
          quantity: 1,
          unitPrice: 320000,
          total: 320000,
        },
        {
          description: "Mesa de noche con USB integrado",
          quantity: 2,
          unitPrice: 75000,
          total: 150000,
        },
        {
          description: "Tapizado y acabados premium",
          quantity: 1,
          unitPrice: 100000,
          total: 100000,
        },
      ],
    },
    {
      quoteNumber: `COT-${new Date().getFullYear()}-0004`,
      clientName: "Roberto Sánchez",
      clientEmail: "roberto.sanchez@email.com",
      clientPhone: "+506 6364 4915",
      clientAddress: "Alajuela, Centro, Avenida 2, Local #8",
      projectName: "Oficina Corporativa - Diseño e Implementación",
      projectDescription: "Diseño e implementación completa de oficina corporativa con espacios colaborativos.",
      status: "sent",
      validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      subtotal: 4500000,
      tax: 585000,
      discount: 225000,
      total: 4860000,
      notes: "Cotización corporativa con descuento por volumen. Incluye diseño, mobiliario y instalación. Plazo de ejecución: 12 semanas.",
      items: [
        {
          description: "Diseño arquitectónico y planificación",
          quantity: 1,
          unitPrice: 500000,
          total: 500000,
        },
        {
          description: "Mobiliario ergonómico para 15 puestos de trabajo",
          quantity: 15,
          unitPrice: 120000,
          total: 1800000,
        },
        {
          description: "Salas de reuniones (3 unidades)",
          quantity: 3,
          unitPrice: 350000,
          total: 1050000,
        },
        {
          description: "Sistema de iluminación LED inteligente",
          quantity: 1,
          unitPrice: 400000,
          total: 400000,
        },
        {
          description: "Divisiones con drywall y vidrio",
          quantity: 1,
          unitPrice: 350000,
          total: 350000,
        },
        {
          description: "Pisos laminados de alta gama",
          quantity: 1,
          unitPrice: 200000,
          total: 200000,
        },
        {
          description: "Instalación eléctrica y cableado estructurado",
          quantity: 1,
          unitPrice: 200000,
          total: 200000,
        },
      ],
    },
    {
      quoteNumber: `COT-${new Date().getFullYear()}-0005`,
      clientName: "Laura Fernández",
      clientEmail: "laura.fernandez@email.com",
      clientPhone: "+506 6364 4915",
      clientAddress: "San José, Escazú, Residencial Los Laureles, Casa #23",
      projectName: "Closet Walk-in Personalizado",
      projectDescription: "Diseño e instalación de walk-in closet personalizado con sistema de organización completo.",
      status: "rejected",
      validUntil: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expirada hace 10 días
      subtotal: 950000,
      tax: 123500,
      discount: 0,
      total: 1073500,
      notes: "Cotización rechazada por el cliente. Presupuesto fuera de rango.",
      items: [
        {
          description: "Diseño personalizado de closet",
          quantity: 1,
          unitPrice: 80000,
          total: 80000,
        },
        {
          description: "Sistema modular con estantes y colgadores",
          quantity: 1,
          unitPrice: 420000,
          total: 420000,
        },
        {
          description: "Cajones con sistema de organización",
          quantity: 8,
          unitPrice: 35000,
          total: 280000,
        },
        {
          description: "Puertas correderas con espejo",
          quantity: 3,
          unitPrice: 50000,
          total: 150000,
        },
        {
          description: "Iluminación LED integrada",
          quantity: 1,
          unitPrice: 20000,
          total: 20000,
        },
      ],
    },
  ];

  console.log("Creating quotes...");
  for (const quoteData of quotes) {
    const { items, ...quoteFields } = quoteData;
    const quote = await prisma.quote.create({
      data: {
        ...quoteFields,
        sentAt: quoteData.status === "sent" || quoteData.status === "accepted" ? new Date() : null,
      },
    });

    // Crear items de la cotización
    for (const item of items) {
      await prisma.quoteItem.create({
        data: {
          quoteId: quote.id,
          ...item,
        },
      });
    }
  }
  console.log(`Created ${quotes.length} quotes`);

  // Ajustar secuencia anual según la cantidad creada
  const currentYear = new Date().getFullYear();
  await prisma.quoteSequence.upsert({
    where: { year: currentYear },
    update: { lastNumber: quotes.length },
    create: { year: currentYear, lastNumber: quotes.length },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

