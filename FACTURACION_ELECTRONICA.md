# Facturación Electrónica — Investigación e Integración con Hacienda (TribuCR)

> Documento vivo. Fase actual: **implementado y en uso** (generación, firma, envío a Hacienda, consulta de estado, PDF y envío por correo — módulo `/admin/invoices`). Lo que queda pendiente son notas de crédito/débito, Recibo Electrónico de Pago, y el piloto con credenciales de producción reales de Habita Studio (hoy se prueba con la identidad sandbox de Jeffrey). Ver sección 11 para la guía de cómo replicar esto en otro proyecto.
> Última investigación: 2026-07-18.

## 1. Contexto y panorama general

- **TRIBU-CR** es la plataforma tributaria integrada de Costa Rica, en operación desde el **6 de octubre de 2025**, y reemplazó al antiguo sistema **ATV** (Administración Tributaria Virtual). Toda gestión (RUT, credenciales, llave criptográfica, declaraciones) se hace ahora desde la **Oficina Virtual Integrada (OVI)**: `ovitribucr.hacienda.go.cr`.
- La **versión 4.4** del esquema de comprobantes electrónicos es **obligatoria desde el 1 de septiembre de 2025**, reemplazando la 4.3. Trae ~146 cambios técnicos/funcionales sobre el XML (más de 70 campos nuevos), incluyendo un nuevo tipo de comprobante: el **Recibo Electrónico de Pago**.
- El **API de recepción de comprobantes** (`api.comprobanteselectronicos.go.cr`) sigue siendo el mecanismo de envío bajo TRIBU-CR — no encontré evidencia de que TRIBU-CR haya introducido un endpoint de sumisión distinto; lo que cambió es dónde se gestionan las credenciales (ahora en OVI/TRIBU-CR en vez de ATV). **Esto hay que reverificar en el momento de implementar**, pidiendo confirmación explícita en la documentación oficial vigente al momento (los enlaces de abajo son la mejor fuente disponible hoy).
- **Cambio inminente e importante**: a partir del **27 de julio de 2026** (¡en unos días!), toda llave criptográfica nueva debe llevar un **PIN de 14 caracteres** (mayúscula, minúscula, número y carácter especial) en vez del PIN de 4 dígitos actual. Las llaves de 4 dígitos generadas antes de esa fecha siguen siendo válidas hasta que venzan o se revoquen. **Implicación práctica**: si generamos la llave criptográfica de Habita Studio después del 27/07/2026, ya nos tocará el PIN largo — no es algo que podamos evitar, solo hay que tenerlo en cuenta al automatizar el uso del PIN en el sistema (no hardcodear asumiendo 4 dígitos).

## 2. Qué necesita Habita Studio para poder facturar electrónicamente

Antes de cualquier código, esto son trámites/decisiones que dependen de la empresa, no del sistema:

1. **Estar inscrito en el RUT (Registro Único Tributario)** con actividad económica lucrativa activa — sin esto no se puede inscribir como emisor electrónico. *(Verificar con el usuario si Habita Studio ya está inscrito y bajo qué régimen — tradicional o simplificado. El régimen simplificado tiene reglas distintas de facturación.)*
2. **Usuario en OVI/TRIBU-CR** (`ovitribucr.hacienda.go.cr`) con la cédula jurídica de la empresa (o física si aplica), y el perfil correcto (representante legal si es persona jurídica).
3. **Generar la llave criptográfica** (certificado `.p12`) desde TRIBU-CR — es **gratuita**, la emite el propio Ministerio de Hacienda (no hay que pagarle a un tercero para esto). Pasos, según la guía oficial:
   1. Ingresar a OVI/TRIBU-CR con usuario y clave + código de verificación (correo o SMS).
   2. Seleccionar el Obligado Tributario correcto (si hay varias empresas asociadas).
   3. El sistema entrega **usuario y contraseña de producción** (se guardan también por correo).
   4. Descargar el archivo del certificado (`.p12`) — revisar carpeta de descargas del navegador.
   5. Crear el **PIN** de la llave (4 dígitos hoy; 14 caracteres obligatorio desde el 27/07/2026 — ver arriba).
   6. Guardar certificado + PIN en un lugar seguro (esto es lo que el sistema usará para firmar cada comprobante).
   - Vigencia de la llave: **2 años**, luego hay que renovarla.
4. **Aclaración importante que puede generar confusión**: existe una **firma digital de persona física emitida por el BCCR/SINPE** (la de las tarjetas inteligentes, usada para trámites gubernamentales en general) que es un sistema **distinto** de la llave criptográfica de Hacienda. Para facturar electrónicamente **no necesitamos** la firma digital BCCR — con la llave criptográfica de TRIBU-CR basta. Sí existe el concepto de **"sello electrónico" de persona jurídica** (certificado corporativo para firmar de forma automatizada sin intervención humana en cada factura) que es conceptualmente lo que usaremos vía la llave criptográfica del sistema.
5. **Confirmar la actividad económica registrada** y su **código CABYS por defecto** para los servicios de Habita Studio (mobiliario, remodelación) — necesario para clasificar correctamente las líneas de cada factura.

**Preguntas pendientes para el usuario (no bloquean la investigación, sí bloquean la implementación):**
- ¿Habita Studio ya está inscrito en TRIBU-CR / tiene usuario en OVI?
- ¿Régimen tradicional o simplificado?
- ¿Cédula jurídica y actividades económicas registradas actuales?
- ¿Ya existe una llave criptográfica generada, o hay que generarla desde cero? (si es desde cero, ya nos tocará el PIN de 14 caracteres dado que estamos a días del cambio)

## 3. Tipos de comprobante (esquema v4.4)

Cada uno tiene su propio XSD:

| Comprobante | Uso en Habita Studio |
|---|---|
| **Factura Electrónica** (`FacturaElectronica_V4.4.xsd`) | El documento fiscal principal — reemplazaría o complementaría el "Recibo" interno actual al momento de facturar una cotización aceptada / venta. |
| **Tiquete Electrónico** (`TiqueteElectronico_V4.4.xsd`) | Para ventas a consumidor final sin necesidad de identificación del receptor (ej. venta de mostrador en el catálogo). |
| **Nota de Crédito Electrónica** (`NotaCreditoElectronica_V4.4.xsd`) | Para anular/corregir una factura ya emitida (devoluciones, errores). |
| **Nota de Débito Electrónica** (`NotaDebitoElectronica_V4.4.xsd`) | Para cargos adicionales sobre una factura ya emitida. |
| **Recibo Electrónico de Pago** (`ReciboElectronicoPago_V4.4.xsd`) | Nuevo en 4.4 — parece encajar naturalmente con el modelo `Receipt` que ya existe en el sistema (pagos parciales sobre una cotización). **Hay que confirmar en la documentación oficial si este es el comprobante correcto para nuestro flujo actual de "recibos de pago sobre una cotización", o si Hacienda espera que cada pago se facture como Factura Electrónica.** |
| Factura Electrónica de Compra / Exportación | Probablemente no aplican al modelo de negocio actual (venta local). |

Todos los XSD y su documentación en Word/PDF están publicados en la página oficial de Anexos y Estructuras (ver fuentes).

## 4. Estructura técnica del comprobante

### 4.1 Clave numérica (50 dígitos)

Identificador único del comprobante, generado por nuestro propio sistema (no por Hacienda) siguiendo un algoritmo estricto:

| Posición | Longitud | Contenido |
|---|---|---|
| 1–3 | 3 | Código de país: `506` |
| 4–9 | 6 | Fecha de emisión `DDMMYY` |
| 10–21 | 12 | Cédula del emisor (rellenada con ceros a la izquierda) |
| 22–41 | 20 | Consecutivo (ver 4.2) |
| 42 | 1 | Situación del comprobante: `1` normal, `2` contingencia, `3` sin internet |
| 43–50 | 8 | Código de seguridad (generado por nuestro sistema, algoritmo con dígito verificador módulo 11) |

### 4.2 Consecutivo (20 dígitos)

| Posición | Longitud | Contenido |
|---|---|---|
| 1–3 | 3 | Sucursal (`001` = casa matriz) |
| 4–8 | 5 | Terminal / punto de venta |
| 9–10 | 2 | Tipo de documento: `01` Factura, `02` Nota Débito, `03` Nota Crédito, `04` Tiquete, etc. (confirmar tabla completa v4.4, puede haber cambiado respecto a versiones previas) |
| 11–20 | 10 | Número consecutivo secuencial, independiente por sucursal+terminal+tipo de documento |

**Implicación de diseño**: como Habita Studio es una sola sucursal/punto de venta, esto simplifica bastante — pero cada tipo de documento (factura, nota crédito, recibo de pago) necesita su **propio contador secuencial independiente**, similar a como ya existen `QuoteSequence`/`ReceiptSequence`/`WorkOrderSequence` en el schema actual. Tocará crear una secuencia equivalente por tipo de comprobante electrónico.

### 4.3 Código CABYS (obligatorio, 13 dígitos)

- Catálogo de Bienes y Servicios de Costa Rica (BCCR + Hacienda). **Cada línea de detalle de cada comprobante debe llevar un código CABYS válido** — sin él, Hacienda rechaza el comprobante automáticamente.
- Es jerárquico: 1 dígito → categoría general, hasta 13 dígitos → producto/servicio específico.
- Se puede consultar vía la API pública de Hacienda (`/fe/cabys`, ver sección 5) o descargar el catálogo completo del BCCR.
- **Tarea de catalogación pendiente**: hay que mapear cada producto del catálogo de Habita Studio (`Product.category`, servicios) a un código CABYS. Esto es trabajo manual/de negocio, no solo técnico — probablemente conviene agregar un campo `cabysCode` a `Product` y a los ítems de cotización/factura.

## 5. API de Hacienda

Dos APIs distintas, no confundir:

### 5.1 API de recepción de comprobantes (envío/consulta de facturas)

- **Producción**: `https://api.comprobanteselectronicos.go.cr/recepcion/v1/` *(no confirmado aún en vivo — a verificar al pasar a producción)*
- **Sandbox/Staging**: `https://api-sandbox.comprobanteselectronicos.go.cr/recepcion/v1` — **confirmado en vivo** desde el panel "Credenciales pruebas" de Tico Factura/OVI (2026-07-18).
- **Autenticación**: OAuth 2.0 / OpenID Connect.
  - Token URL producción: `https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token` *(no confirmado aún en vivo)*
  - Token URL sandbox: `https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token` — **confirmado en vivo**.
  - `client_id`: `api-prod` (producción, no confirmado) / `api-stag` (sandbox, **confirmado**), client secret y scope vacíos.
  - El usuario/contraseña son los que TRIBU-CR entrega al generar la llave criptográfica (grant type `password`, típico de estos flujos OIDC gubernamentales). Formato de usuario confirmado: `cpf-{tipo}-{cédula}@stag.comprobanteselectronicos.go.cr`.

> **Progreso 2026-07-18**: credenciales de sandbox generadas bajo la cédula personal de Jeffrey (Tico Factura), guardadas en `.env` como `HACIENDA_FE_*`. Llave criptográfica de pruebas (`.p12` + PIN) descargada y guardada en `.secrets/hacienda-fe-sandbox.p12` (fuera de git). **Conectividad end-to-end verificada**: se obtuvo un `access_token` Bearer real contra el IDP sandbox, y se confirmó que el API de recepción exige ese token (401 sin token, 400 con token pero clave inválida/inventada — comportamiento esperado). Certificado verificado con `openssl pkcs12`: pertenece a JEFFRY JOSE VALERIO ANGULO, emitido por "MINISTERIO DE HACIENDA - SANDBOX", válido desde 2026-07-18.
>
> **Progreso 2026-07-18 (parte 2) — primer envío real de prueba**: se construyó un XML completo de Factura Electrónica v4.4 (`scripts/hacienda-fe-test.js`, script de prueba, no forma parte de la app todavía), firmado con XAdES-EPES real (usando `xadesjs` directamente — **no** la librería `haciendacostarica-signer`, que tiene hardcodeada la política de firma vieja de 2016 y le falta el `digestValue`; se corrigió apuntando a la resolución v4.4 vigente con su hash SHA-1 real calculado del PDF oficial), y enviado al API de recepción sandbox.
>
> **Resultado**: el comprobante fue procesado exitosamente por Hacienda (firma XAdES-EPES aceptada, estructura XML validada contra el XSD completo) — quedó en estado `rechazado` solo por 2 razones que requieren datos reales que no tengo:
> 1. Provincia/cantón/distrito del emisor no coinciden con el registro de la DGT (se usó un valor de prueba).
> 2. El código de actividad económica ("6209.0" según el API público `/fe/ae`) no es válido según el catálogo — posible causa: migración a códigos CIIU versión 4 vigente desde el 6 de octubre de 2025, que puede requerir un código distinto al que expone el API público.
>
> Errores ya resueltos en el camino (quedan documentados por si se repiten): hora de emisión sin offset explícito (Hacienda exige que coincida con la hora oficial CR), campos obligatorios faltantes en el XML (`BaseImponible`, `ImpuestoAsumidoEmisorFabrica`), nodo `MedioPago` obligatorio cuando la condición de venta es "Contado", código CABYS inventado (se reemplazó por uno real consultado vía `/fe/cabys`), identificación de receptor inventada (se usó una cédula real para la prueba).
>
> **Pendiente para continuar**: confirmar con el usuario, desde su perfil en TRIBU-CR ("Mis datos"), la provincia/cantón/distrito exactos y el código de actividad económica tal como está registrado actualmente.
>
> **✅ Progreso 2026-07-18 (parte 3) — PRIMER COMPROBANTE ACEPTADO.** Se resolvió el último bloqueo: `CodigoActividadEmisor` no va como 6 dígitos numéricos (interpretación incorrecta de "6 caracteres" en el XSD) sino **literal con el punto** — ej. `4719.9`, tal como aparece en el catálogo de actividades del contribuyente. Esto se confirmó viendo el XML real de un comprobante ya aceptado en producción (Ark Tee, el otro negocio del usuario), no adivinando. También se agregó el campo opcional `Barrio`. Con eso:
>
> ```
> <EstadoMensaje>Aceptado</EstadoMensaje>
> ```
>
> El aviso de provincia/cantón/distrito (código -37) pasó a ser una nota informativa dentro de un comprobante ya *aceptado*, no un motivo de rechazo — confirma que era un efecto colateral del código de actividad inválido, no un problema real de esos códigos (que ya se habían verificado correctos contra la codificación oficial de Hacienda: Provincia 1 / Cantón 08 / Distrito 02, San Francisco de Goicoechea).
>
> **Con esto, el objetivo de "primero la prueba" queda cumplido**: se demostró un flujo end-to-end real y funcional — construcción del XML v4.4 contra el XSD oficial, firma XAdES-EPES con la política v4.4 correcta, envío al API de recepción, y aceptación por Hacienda — todo en el ambiente sandbox, con el script `scripts/hacienda-fe-test.js` como prueba de concepto (no forma parte de la app todavía).
>
> **✅ Progreso 2026-07-18 (parte 4) — Fase 1 completada: modelado en Prisma.** Se agregaron a `prisma/schema.prisma` y ya están aplicados en producción (`db push`):
> - `ElectronicDocument` — ciclo de vida de cada comprobante (clave, consecutivo, estado, XML firmado, respuesta de Hacienda), relacionado opcionalmente a `Quote` y/o `Receipt`.
> - `ElectronicDocumentSequence` — numeración consecutiva por tipo de documento (no se reinicia por año).
> - `EmisorConfig` — datos fiscales de Habita Studio (singleton). Las credenciales (usuario/contraseña OAuth, `.p12`, PIN) siguen fuera de la base de datos, en variables de entorno.
> - `Customer.identificacionTipo` / `identificacionNumero` — identificación fiscal del receptor.
> - `QuoteItem.cabysCode` / `unidadMedida` — requeridos por línea al generar un comprobante.
>
> Todos los campos nuevos son opcionales o tienen valor por defecto, así que no rompe nada existente.
>
> **✅ Progreso 2026-07-18 (parte 5) — Fase 2 completada: generar y enviar Factura desde la OT.**
>
> Implementado según el flujo definido por el usuario: la Factura nace de la Orden de Trabajo una vez llega a la etapa **Entregado**, con dos botones separados y manuales — "Generar Factura" (arma y firma el XML, no lo envía) y "Enviar a Hacienda" (solo entonces se hace el `POST /recepcion`).
>
> - `lib/hacienda/{clave,xml,sign,api}.ts` — la lógica del script de prueba, parametrizada y reutilizable.
> - `app/actions/electronic-documents.ts` — Server Actions (`generateFacturaForWorkOrder`, `sendElectronicDocument`, `checkElectronicDocumentStatus`, `getElectronicDocuments`, `getEmisorConfig`/`saveEmisorConfig`, `searchCabys`).
> - `components/admin/work-order-invoice-card.tsx` — se agrega al detalle de la OT (visible solo si `entregadoCompletedAt` está definido); el diálogo de "Generar Factura" pide la identificación del cliente y el código CABYS/unidad de medida por ítem (con buscador contra el catálogo público de Hacienda), y guarda esos datos de vuelta en `Customer`/`QuoteItem` para no volver a pedirlos.
> - `/admin/invoices` — ya no es un placeholder, lista los comprobantes generados.
> - `/admin/settings/facturacion-electronica` — pantalla nueva para los datos fiscales del emisor (`EmisorConfig`). Ya se dejó poblada con la identidad de prueba (Jeffrey/sandbox) para poder probar el flujo real.
> - Se agregó `components/ui/dialog.tsx` (no existía en el proyecto).
>
> **Verificación realizada**: se confirmó que los módulos `lib/hacienda/*` ya integrados producen exactamente el mismo resultado exitoso (`Aceptado`) que el script de prueba original (`scripts/verify-lib-hacienda.ts`, `npx tsx scripts/verify-lib-hacienda.ts`), y `npx tsc --noEmit` + `npx next build` pasan limpios. **No se pudo probar el flujo completo haciendo clic en la UI real** (el botón "Generar Factura" en una OT, el diálogo, "Enviar a Hacienda") porque no hay credenciales de administrador disponibles para iniciar sesión contra la base de datos de producción — queda pendiente que el usuario lo pruebe directamente.
>
> **⚠️ Hallazgo importante para el despliegue**: `readP12Base64()` originalmente leía el archivo `.p12` desde `.secrets/` (carpeta en `.gitignore`, nunca se sube a git) — eso **no habría funcionado en Vercel**, donde ese archivo no existe en el filesystem del deploy. Se corrigió para leer primero `HACIENDA_FE_P12_BASE64` (el certificado en base64 directo en una variable de entorno), con el archivo local como respaldo solo para desarrollo. **Pendiente**: antes de que esta función sirva en producción (aunque sea contra sandbox), hay que configurar en Vercel las mismas variables `HACIENDA_FE_*` que ya están en `.env` local (incluyendo `HACIENDA_FE_P12_BASE64`).
>
> **✅ Progreso 2026-07-18 (parte 6) — reubicación al módulo de Facturas + PDF + bug real corregido.**
>
> Por indicación del usuario, "Generar Factura" y "Enviar a Hacienda" se movieron del detalle de la OT al módulo `/admin/invoices`: ahí aparece una fila por cada OT entregada (con o sin factura generada todavía), con las acciones correspondientes según el estado. Se eliminó `work-order-invoice-card.tsx` (ya no se usa). Se agregó descarga de PDF (`lib/generate-invoice-pdf.ts`, mismo patrón que cotizaciones/recibos) y descarga del XML firmado / respuesta de Hacienda, disponibles en cuanto la factura se genera, sin necesidad de enviarla a Hacienda.
>
> **Bug real encontrado y corregido probando con datos reales**: al generar la factura de una OT real (OT-2026-0002, Laura Miranda — un clóset + transporte), Hacienda rechazó con `-111`/`-110`: el resumen del XML metía todo bajo `TotalServGravados`, pero un clóset físico es **mercancía**, no servicio, y Hacienda exige separarlos en campos distintos (`TotalServGravados` vs `TotalMercanciasGravadas`). Se agregó `lib/hacienda/cabys.ts` (`isCabysMercancia`), que clasifica cada código CABYS usando `categorias[0]` del catálogo público ("Bienes..." vs "Servicios..."), y se corrigió `lib/hacienda/xml.ts` y `generateFacturaForWorkOrder` para separar los totales correctamente. **Verificado**: reenviando la misma factura corregida a Hacienda, los errores -111/-110 desaparecieron por completo. Dado que Habita Studio vende principalmente muebles físicos, este bug habría afectado casi todas las facturas reales — quedó descubierto y corregido antes de que el usuario lo viera.
>
> Queda un `ElectronicDocument` en estado `borrador` para **OT-2026-0002** (clave `50618072600011481042500100001010000000004144899825`), listo para que el usuario pruebe el botón "Enviar a Hacienda" desde `/admin/invoices`. La identificación de Laura Miranda quedó con el valor de prueba `01-000000000` (confirmado con el usuario) — hay que corregirla con su cédula real antes de que esta factura específica tenga sentido enviarla de verdad (aunque sea a sandbox, Hacienda la rechazará por identificación inválida hasta corregirla).
>
> **Siguiente paso**: que el usuario pruebe el flujo real en la UI (`/admin/invoices`) y reporte qué encuentra. Fase 3 (fuera de alcance, ya identificada): decidir si los Recibos existentes también se vuelven Recibo Electrónico de Pago ante Hacienda.
- **Enviar un comprobante**: `POST /recepcion`
  - Body JSON: `clave` (la de 50 dígitos), `fecha` (ISO 8601), `emisor` (tipo+número de identificación), `receptor` (opcional), `comprobanteXml` (el XML firmado con XAdES-EPES, codificado en Base64), `callbackUrl` (opcional, para notificación asíncrona).
  - Respuesta `201`: recibido, queda en validación (no significa aceptado todavía).
  - `400`: error de validación (formato). `401`: no autorizado.
- **Consultar estado**: `GET /recepcion/{clave}`
  - Devuelve `ind-estado`: `recibido` → `procesando` → `aceptado` | `rechazado` | `error`.
  - Incluye `respuesta-xml` en Base64 cuando ya hay una respuesta de Hacienda (el "Mensaje Hacienda").
  - Hacienda dice validar en un plazo máximo de **3 horas**, aunque en la práctica suele ser mucho más rápido — hay que diseñar el sistema para *no* asumir respuesta síncrona (necesita polling o webhook vía `callbackUrl`).
- **Rate limiting**: cabeceras `X-Ratelimit-Limit` / `X-Ratelimit-Remaining` / `X-Ratelimit-Reset`. Cifras exactas no confirmadas en la documentación pública revisada — hay que revisarlas al implementar (o simplemente respetar las cabeceras dinámicamente).

### 5.2 API pública de consulta (datos de referencia, sin autenticación aparente)

Base: `https://api.hacienda.go.cr/`

| Endpoint | Uso |
|---|---|
| `/fe/ae?identificacion=...` | Datos del contribuyente (nombre, tipo de cédula, régimen, actividades económicas) — útil para autocompletar datos del receptor al facturar a un cliente por su cédula. |
| `/fe/cabys` | Catálogo CABYS, buscable por código o descripción. |
| Tipo de cambio (dólar/euro) | Para comprobantes en moneda extranjera (probablemente no aplica, Habita Studio factura en CRC). |
| `/fe/ex` | Consulta de exoneraciones. |

Límites documentados: ráfagas cortas máx. 100 peticiones/5s, sostenido máx. 1200/2min, bloqueo de IP de 10 min si se excede.

## 6. Firma digital (XAdES-EPES)

- Cada comprobante XML lleva una sección `<Signature>` firmada digitalmente con el estándar **XMLDSig + extensión XAdES-EPES** (Explicit Policy Electronic Signature — referencia explícita a la política de firma que define Hacienda).
- La firma se hace con la llave criptográfica `.p12` + su PIN.
- **Riesgo técnico identificado**: la librería más viable en el ecosistema Node/TypeScript es [`xadesjs`](https://www.npmjs.com/package/xadesjs) (basada en `xmldsigjs` + Web Crypto API), pero **solo soporta XAdES-BES "out of the box"**; XAdES-EPES (lo que exige Hacienda CR) requiere construir manualmente el `SignaturePolicyIdentifier` y validar que el resultado cumpla el perfil exacto que Hacienda espera. Esto es probablemente el punto más delicado de toda la implementación — vale la pena, al llegar a la fase de construcción, revisar primero cómo lo resuelven las librerías de referencia (ver sección 7) antes de escribirlo desde cero.
- Alternativa a evaluar: firmar vía un microservicio o librería en otro lenguaje con soporte XAdES-EPES más maduro (Java tiene librerías más completas para esto), invocado desde el backend Next.js — a decidir en la fase de diseño técnico, no ahora.

## 7. Referencias de código existentes (no para copiar tal cual, sí para entender el flujo real)

- **[facturar-costa-rica-lib](https://github.com/facturacr/facturar-costa-rica-lib)** — SDK en TypeScript/JavaScript, en beta, para generar facturas y hablar con el API de Hacienda. El más directamente relevante dado nuestro stack (Next.js/TypeScript).
- **[CRLibre/API_Hacienda](https://github.com/CRLibre/API_Hacienda)** — API libre en PHP, pero con buena documentación conceptual del flujo completo (manejo de llave, tokens, generación XML, firma, envío, consulta de estado). Útil como referencia de arquitectura aunque no sea el lenguaje que usamos.
- **[royrojas/FacturaElectronicaCR](https://github.com/royrojas/FacturaElectronicaCR)** — ejemplo en VB.NET/C#, y el blog de royrojas.com tiene desgloses técnicos muy precisos (clave numérica, mensaje receptor) que ya se incorporaron a este documento.
- **[apokalipto/facturacr](https://github.com/apokalipto/facturacr)** — otra referencia a revisar en la fase de diseño técnico.

## 8. Flujo completo end-to-end (resumen)

1. Se genera el XML del comprobante según el XSD v4.4 correspondiente, con la `clave` calculada y cada línea con su código CABYS.
2. Se firma el XML con XAdES-EPES usando la llave criptográfica `.p12` + PIN.
3. Se codifica en Base64 y se envía por `POST /recepcion` junto con la `clave`, `fecha` y `emisor`.
4. Se guarda el estado inicial (`recibido`) y se hace *polling* a `GET /recepcion/{clave}` (o se recibe el callback si se configuró `callbackUrl`) hasta obtener `aceptado` o `rechazado`.
5. Si es **rechazado**, Hacienda devuelve el motivo en el `respuesta-xml` — hay que mostrarlo en el admin para corregir y reintentar.
6. Si es **aceptado**, el comprobante (XML firmado + respuesta de Hacienda) se envía al **receptor** (el cliente) — típicamente por correo, adjuntando el XML y un PDF/representación legible (la "factura" visual que ya generamos hoy con `generate-pdf-server.ts` tendría que evolucionar para incluir estos datos fiscales).
7. El receptor (si es contribuyente, no consumidor final) debe responder con un **Mensaje Receptor** (`05` aceptación, `06` aceptación parcial, `07` rechazo) dentro de los **primeros 8 días hábiles** del mes siguiente — esto normalmente lo hace el sistema del cliente, no el nuestro, pero como emisores debemos estar preparados para **recibir y registrar** ese mensaje si el cliente nos lo envía.

## 9. Brecha actual del sistema (Habita Studio) vs lo que se necesita

Basado en `prisma/schema.prisma` actual:

- **No existe ningún modelo para el comprobante electrónico en sí** (clave numérica, consecutivo, XML firmado, estado ante Hacienda, respuesta). Los modelos `Quote` y `Receipt` actuales son documentos internos (cotización y recibo de pago informal) — ninguno es un comprobante fiscal reconocido por Hacienda. Habrá que crear un modelo nuevo, algo como `ElectronicDocument` (tipo, clave, consecutivo, xmlFirmado, estado, respuestaHacienda, quoteId/receiptId relacionado).
- **`Customer` no tiene campo de identificación fiscal** (tipo + número de cédula física/jurídica) — obligatorio para el receptor en la mayoría de los comprobantes (excepto tiquete a consumidor final sin identificar).
- **`QuoteItem` no tiene código CABYS ni unidad de medida** — obligatorios por línea.
- **No hay modelo para los datos del emisor** (nuestra propia cédula jurídica, actividad económica/CABYS por defecto, ubicación con codificación oficial de provincia/cantón/distrito) — hoy esos datos no existen en ningún lado del sistema.
- **No hay almacenamiento seguro para la llave criptográfica `.p12` y su PIN** — esto es un secreto sensible que necesita manejo cuidadoso (probablemente variable de entorno + el archivo en un storage seguro, no en el repo ni en la base de datos en texto plano).
- El PDF de recibo/cotización actual (`lib/generate-pdf-server.ts`, `lib/generate-receipt-pdf-server.ts`) tendría que evolucionar para incluir los datos fiscales obligatorios en la representación visual (clave numérica, código QR opcional, leyenda de "Comprobante autorizado por Hacienda", etc. — confirmar requisitos exactos de la representación gráfica en la documentación oficial).

## 10. Plan por fases (propuesto, a validar contigo antes de tocar código)

1. **Fase 0 — Trámites y decisiones de negocio** (no depende de mí): confirmar inscripción RUT/TRIBU-CR, régimen, generar llave criptográfica de pruebas (sandbox) y de producción, decidir códigos CABYS de los servicios/productos principales.
2. **Fase 1 — Modelado de datos**: agregar a Prisma los modelos/campos que faltan (documento electrónico, identificación fiscal del cliente, CABYS por ítem, datos del emisor).
3. **Fase 2 — Generación de XML**: construir el XML de Factura Electrónica (empezar solo por este tipo, no los 6 a la vez) validado contra el XSD oficial, sin firma todavía.
4. **Fase 3 — Firma digital**: resolver XAdES-EPES (el punto de mayor riesgo técnico, ver sección 6) contra el ambiente de **sandbox** de Hacienda.
5. **Fase 4 — Envío y consulta de estado**: integrar `POST /recepcion` + polling/consulta de estado, todavía en sandbox.
6. **Fase 5 — Flujo con el receptor**: envío del comprobante aceptado al cliente, manejo de Mensaje Receptor entrante.
7. **Fase 6 — Piloto en producción**: con credenciales reales, empezando probablemente por un solo tipo de comprobante y un volumen bajo controlado.
8. **Fase 7 — Notas de crédito/débito y Recibo Electrónico de Pago**: una vez estable el flujo principal.

## 11. Guía reutilizable: cómo implementar esto en otro proyecto

Notas para mí mismo (Claude) la próxima vez que tenga que integrar facturación electrónica de Costa Rica (Hacienda/TRIBU-CR) en un proyecto distinto a Habita Studio — stack Next.js + Prisma/PostgreSQL + Server Actions, pero la mayoría de esto aplica a cualquier backend Node/TypeScript. No es teoría: son las decisiones y errores reales que aparecieron construyendo esto aquí.

### 11.1 Trámites previos (no dependen del código)

Antes de escribir nada, confirmar con el usuario/negocio (ver sección 2 para el detalle completo):
- Inscripción en RUT/TRIBU-CR con actividad económica activa, régimen (tradicional/simplificado).
- Llave criptográfica `.p12` generada desde OVI/TRIBU-CR + su PIN (4 dígitos si se generó antes del 27/07/2026, 14 caracteres después).
- Credenciales de **sandbox** primero (`api-sandbox.comprobanteselectronicos.go.cr`) — nunca empezar contra producción.
- Códigos CABYS por defecto de los productos/servicios principales del negocio (catalogación es trabajo de negocio, no técnico — no asumirlos).

### 11.2 Modelo de datos mínimo (Prisma, adaptar nombres al proyecto)

```prisma
model ElectronicDocument {
  id           String   @id @default(cuid())
  tipo         String   // factura, tiquete, notaCredito, notaDebito, reciboPago
  clave        String   @unique // 50 dígitos
  consecutivo  String   // 20 dígitos
  estado       String   @default("borrador") // borrador, procesando, aceptado, rechazado, error
  xmlFirmado   String   @db.Text
  respuestaXml String?  @db.Text
  fechaEmision DateTime
  // relación al documento interno de origen (Quote/Order/lo que exista en el proyecto)
}

model ElectronicDocumentSequence {
  tipoDocumento String @id // "01" Factura, "03" Nota Crédito, "04" Tiquete, etc.
  lastNumber    Int    @default(0)
}

model EmisorConfig { // datos fiscales del emisor, fila única — las credenciales NO viven aquí, van en env vars
  nombre, nombreComercial?, identificacionTipo, identificacionNumero,
  actividadEconomica, provincia, canton, distrito, barrio?, otrasSenas,
  telefonoCodigoPais, telefono, correoElectronico
}
```
Además: el modelo de cliente/receptor necesita `identificacionTipo`/`identificacionNumero` (fiscal), y cada línea de ítem facturable necesita `cabysCode` (13 dígitos) + `unidadMedida`. Guardar estos datos de vuelta en el modelo de origen (cliente, ítem de cotización) la primera vez que se piden, para no volver a preguntarlos — así fue como se hizo aquí (`generateFacturaForWorkOrder` persiste `cabysCode`/identificación al generar).

### 11.3 Estructura de módulos que funcionó bien

```
lib/hacienda/
  clave.ts   — buildConsecutivo(tipoDocumento), buildClaveNumerica(consecutivo, cedulaEmisor, fecha), fechaEmisionCR()
  xml.ts     — buildFacturaXML(input): arma el XML v4.4 completo a partir de datos ya resueltos (nada de I/O aquí)
  sign.ts    — signXAdES(xmlString, p12Base64, pin): firma XAdES-EPES
  api.ts     — getAccessToken(), submitDocument(), queryStatus(), readP12Base64() (env var en prod, archivo en local), getP12Pin()
  cabys.ts   — isCabysMercancia(codigo): clasifica un CABYS como bien o servicio consultando /fe/cabys
```
Mantener `xml.ts` puro (sin `fetch`, sin Prisma) hace que sea trivial de probar con datos falsos antes de tocar Hacienda. Las Server Actions (`app/actions/electronic-documents.ts` aquí) son las que orquestan: leen de la base de datos, arman el input, llaman estos módulos en orden, y persisten el resultado.

### 11.4 Errores reales que van a volver a aparecer — no reinventar la rueda

1. **Import de `xadesjs`/`xml-core` con `import X from "..."` compila con `tsc --noEmit` pero rompe en `next build`** ("Export default doesn't exist in target module"). Usar siempre `import * as xades from "xadesjs"` y `import * as xmlCore from "xml-core"`. **Lección general: `tsc --noEmit` no es suficiente para verificar este tipo de librerías — correr también el build real (`next build`/`webpack`) antes de dar por bueno un cambio.**
2. **La política de firma XAdES-EPES que casi todo el mundo referencia online (incluyendo librerías como `haciendacostarica-signer`) es la de 2016, no la vigente para v4.4** — el resultado firma "bien" mecánicamente pero Hacienda lo rechaza. Verificar la URL de política + hash SHA-1 exactos contra la documentación oficial vigente al momento de implementar (no confiar en ejemplos de blogs/librerías de terceros sin fecha).
3. **Falta de separación Mercancía/Servicio en el resumen del XML causa rechazo silencioso hasta que se prueba con una factura real que mezcle bienes y servicios.** Si se prueba solo con líneas de servicio (o solo de mercancía), este bug no aparece — hay que probar explícitamente con una combinación de ambos antes de dar por buena la integración. La clasificación se obtiene consultando `/fe/cabys?codigo=...` y viendo si `categorias[0]` empieza con `"Bienes"` o `"Servicios"`.
4. **El `.p12` necesita dos formas de lectura**: ruta de archivo local (`.secrets/` o similar, gitignored) para desarrollo, y variable de entorno en base64 para producción (Vercel y plataformas similares no tienen filesystem persistente con esos archivos). Resolver ambos casos en una sola función (`readP12Base64()`) desde el día uno, no como afterthought.
5. **Server Actions que usan `throw` pierden el mensaje de error en producción** (Next.js redacta errores lanzados en el servidor por seguridad). Usar siempre el patrón `return { ok: true|false, message }` en vez de `throw` para cualquier Server Action de este flujo — si no, cualquier rechazo de Hacienda o error de firma se vuelve invisible en producción y solo se puede depurar re-desplegando con logs.
6. **Validar la longitud exacta de clave (50) y consecutivo (20) dentro de la propia función que los construye**, lanzando error si no calzan — esto atrapó un bug propio (consecutivo de prueba con 19 caracteres) inmediatamente en vez de que Hacienda lo rechazara con un mensaje críptico.
7. **PDF generado con `jsPDF`**: si hay columnas con montos en colones (`CRC 207 964,60` es más ancho de lo que parece a 9pt), medir el ancho real del texto con `doc.getTextWidth()` antes de fijar el ancho de columna — no asumir proporciones a ojo, ya causó un solape visual real.

### 11.5 Estrategia de verificación que sí funcionó

- **Probar contra el sandbox real de Hacienda desde el primer momento posible**, no solo contra el XSD/documentación. Cada fase (XML, firma, envío, consulta de estado) se verificó con una llamada real al sandbox, no solo revisión de código — esto encontró bugs reales (formato de `CodigoActividadEmisor`, campos `BaseImponible`/`MedioPago` faltantes, split mercancía/servicio) que la sola lectura de la documentación no hubiera detectado.
- Si no hay forma de probar por la UI (sin credenciales de login, por ejemplo), escribir un **script standalone de Node** (`scripts/*.ts`, usando el mismo Prisma Client y las mismas variables de entorno que la app real) que ejercite la lógica de negocio real de punta a punta — no mockear nada de Hacienda.
- Probar con **datos reales de negocio** (una orden/cotización real que ya exista), no solo con datos inventados — los bugs de clasificación (mercancía/servicio) y de formato solo aparecen con combinaciones reales de ítems.

### 11.6 Decisiones de UX que valió la pena mantener

- **Nada es automático**: generar el comprobante (armar XML + firmar) es un paso manual separado de "enviar a Hacienda". Una factura aceptada por Hacienda no se puede borrar, solo corregir con nota de crédito — así que cada paso queda bajo control explícito del usuario, con un botón por paso (Generar → Enviar → Consultar Estado).
- **Botones de acción sensible (generar, enviar, editar configuración del emisor) restringidos a admin de forma fija**, no configurable por rol — mismo criterio que otras acciones de peso legal/fiscal en el proyecto.
- Ofrecer **dos variantes del PDF/envío por correo**: una formal con los datos de Hacienda (clave, consecutivo, CABYS) para cuando el comprobante ya se generó y se quiere enviar como factura electrónica real, y una simple/tipo-proforma (mismo layout que una cotización, sin datos fiscales) para cuando el cliente solo necesita un documento de cobro interno. Evita forzar todo el flujo de Hacienda cuando no aplica.

---

## Fuentes consultadas

- [TRIBU-CR 2026: qué es, cómo ingresar y trámites paso a paso](https://siemprealdia.co/costa-rica/impuestos/plataforma-tribu-cr/)
- [Facturación electrónica en Costa Rica 2026 | Guía 4.4](https://siemprealdia.co/costa-rica/impuestos/novedades-en-facturacion-electronica/)
- [Anexos y Estructuras v4.4 - ATV - Ministerio de Hacienda](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/frmAnexosyEstructuras.aspx)
- [Comprobantes Electrónicos - Generalidades y Versión 4.4 (PDF, marzo 2025)](https://www.hacienda.go.cr/docs/ComprobantesElectronicos-GeneralidadesyVersion4.4.marzo2025.pdf)
- [Comprobantes Electrónicos API (ATV, v4.4)](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/comprobantes-electronicos-api.html)
- [Documentación de la API pública del Ministerio de Hacienda](https://api.hacienda.go.cr/docs)
- [¿Qué Es Y Cómo Funciona La Clave Numérica En La Factura Electrónica? — HuliPractice](https://blog.hulipractice.com/que-es-y-como-funciona-la-clave-numerica-en-la-factura-electronica-de-costa-rica/)
- [Número Consecutivo y Clave en la Factura Electrónica — royrojas.com](http://www.royrojas.com/numero-consecutivo-y-clave-en-la-factura-electronica-en-costa-rica/)
- [Firma digital en la factura electrónica 4.4](https://siemprealdia.co/costa-rica/impuestos/firma-digital-en-la-factura-electronica/)
- [Cambios clave en la seguridad del PIN de la llave criptográfica — LLB Solutions](https://llbsolutions.com/es/cambios-clave-en-la-seguridad-del-pin-de-la-llave-criptografica-definidos-por-ministerio-de-hacienda/)
- [Guía práctica para generar la llave criptográfica en TRIBU-CR](https://www.facturaprofesional.com/blog/como-generar-la-llave-criptografica-en-tribu-cr-guia-practica-paso-a-paso)
- [¿Cómo generar tu sello electrónico (firma corporativa)? — Alegra](https://ayuda.alegra.com/int/genera-tu-sello-electr%C3%B3nico-para-la-emisi%C3%B3n-de-comprobantes-costa-rica)
- [Códigos CABYS Costa Rica 2026: catálogo, buscador y lista](https://siemprealdia.co/costa-rica/impuestos/codigos-cabys-costa-rica/)
- [Preguntas frecuentes CABYS — BCCR](https://www.bccr.fi.cr/indicadores-economicos/cabys/Preguntas-frecuentes-CABYS.pdf)
- [Comprobantes electrónicos recibidos en TRIBU-CR: aceptación — Mensaje Receptor](https://siemprealdia.co/costa-rica/impuestos/comprobantes-electronicos-recibidos-en-tribu-cr/)
- [Mensaje Receptor para la Factura Electrónica — royrojas.com](http://www.royrojas.com/mensaje-receptor-para-la-factura-electronica-en-costa-rica/)
- [facturar-costa-rica-lib (GitHub)](https://github.com/facturacr/facturar-costa-rica-lib)
- [CRLibre/API_Hacienda (GitHub)](https://github.com/CRLibre/API_Hacienda)
- [royrojas/FacturaElectronicaCR (GitHub)](https://github.com/royrojas/FacturaElectronicaCR)
- [xadesjs (npm)](https://www.npmjs.com/package/xadesjs)
