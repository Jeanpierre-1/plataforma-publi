# Primera etapa del frontend comercial

Entrega local del 14 de noviembre de 2026. Se conserva el proyecto Angular existente.

Este documento conserva el estado de la primera entrega. La continuación del
20 de noviembre de 2026, con el nombre y logo de Sanabria Group ya incorporados,
se encuentra al final.

## Auditoría antes de implementar

Se inspeccionaron `package.json`, `angular.json`, los tres `tsconfig`, PostCSS,
estilos, rutas, componentes, entradas de navegador/servidor y pruebas existentes.
No se encontraron archivos `AGENTS.md` aplicables.

Versiones comprobadas con `npm.cmd ls --depth=0`:

| Herramienta                                                  | Versión instalada |
| ------------------------------------------------------------ | ----------------- |
| Angular (core, common, compiler, router, forms, plataformas) | 22.2.6            |
| Angular CLI, build y SSR                                     | 22.2.7            |
| TypeScript                                                   | 6.0.3             |
| Tailwind y su plugin PostCSS                                 | 4.3.5             |
| PostCSS                                                      | 8.5.33            |
| RxJS                                                         | 7.8.2             |
| Express                                                      | 5.3.0             |
| Vitest                                                       | 5.1.0             |
| jsdom                                                        | 30.1.3            |
| Node.js                                                      | 24.22.3           |

Esta combinación de Node, TypeScript y RxJS es compatible con Angular 22 según la
[matriz oficial](https://angular.dev/reference/versions).

La aplicación generada ya utilizaba standalone, hidratación, el builder
`@angular/build:application`, SSR con Express y prerender global. Tailwind estaba
correctamente integrado mediante `.postcssrc.json` y `@import 'tailwindcss'`.
Las rutas estaban vacías y el único componente mostraba la bienvenida de Angular.
Las dos pruebas originales pasaron antes de editar.

Hallazgos corregidos:

- Faltaban `strict` en TypeScript y `strictTemplates` en Angular.
- `security.allowedHosts: []` rechazaba las peticiones reales al servidor de
  producción con HTTP 400, incluso desde localhost. Se permiten explícitamente
  `localhost`, `127.0.0.1` y `[::1]`, sin comodines.

Durante la revisión visual también se eliminó un reinicio adicional de márgenes
que competía con las utilidades de Tailwind. Esa responsabilidad queda en el
Preflight existente.

No se detectaron integraciones duplicadas de Tailwind ni NgModules heredados.
Se conservaron las versiones, dependencias, configuración SSR, hidratación,
presupuestos de compilación y convenciones de nombres breves del generador.

El plan aplicado fue: endurecer tipado, organizar por responsabilidades,
implementar diseño y navegación comercial, preparar la infraestructura HTTP y
validar el resultado en producción y navegador.

## Estructura resultante

```text
frontend/
├── docs/
│   └── etapa-1.md
├── public/
│   ├── favicon.ico                  # Recurso original conservado
│   ├── favicon.svg                  # Identidad provisional utilizada
│   └── images/creative-composition.svg
├── scripts/
│   └── check-browser.mjs
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config/site-config.ts
│   │   │   ├── http/
│   │   │   │   ├── api-client.ts
│   │   │   │   ├── api-client.spec.ts
│   │   │   │   ├── api-config.ts
│   │   │   │   ├── api-error.ts
│   │   │   │   └── api-error-interceptor.ts
│   │   │   ├── models/api-problem.ts
│   │   │   └── seo/seo-title-strategy.ts
│   │   ├── features/
│   │   │   ├── home/
│   │   │   │   ├── home.ts, home.html, home.css
│   │   │   │   └── services-section.ts, services-section.html, services-section.css
│   │   │   └── provisional/
│   │   │       ├── provisional-page.ts
│   │   │       └── provisional.routes.ts
│   │   ├── layouts/public/
│   │   │   ├── public-layout.ts
│   │   │   ├── site-header.ts, site-header.html, site-header.css
│   │   │   ├── site-header.spec.ts
│   │   │   └── site-footer.ts
│   │   ├── shared/ui/
│   │   │   ├── brand/brand.ts
│   │   │   ├── button/button.ts, button.css
│   │   │   ├── icon/icon.ts
│   │   │   └── site-nav/site-nav.ts, site-nav.css
│   │   ├── app.ts, app.html, app.css, app.spec.ts
│   │   ├── app.config.ts, app.config.server.ts
│   │   └── app.routes.ts, app.routes.server.ts, app.routes.spec.ts
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.development.ts
│   ├── index.html
│   ├── styles.css
│   ├── main.ts, main.server.ts
│   └── server.ts
└── tmp/browser-qa/                  # Ignorado por Git; resultados y capturas locales
```

## Componentes y diseño

Todos los componentes son standalone. Se aprovechan los valores predeterminados
de Angular 22 para standalone y detección de cambios; no se añaden NgModules.
Los servicios nuevos utilizan `@Service()` y la inyección utiliza `inject()`.

| Componente        | Responsabilidad                                                          |
| ----------------- | ------------------------------------------------------------------------ |
| `App`             | Outlet raíz                                                              |
| `PublicLayout`    | Header, main, footer, enlace para saltar contenido y foco al navegar     |
| `SiteHeader`      | Menú adaptable, estado con signals, cierre con Escape y al navegar       |
| `SiteFooter`      | Navegación secundaria y nota sobre la identidad provisional              |
| `Home`            | Presentación, orientación inicial del proyecto y llamados a cotizaciones |
| `ServicesSection` | Presentación de eventos e impresión de gran formato                      |
| `ProvisionalPage` | Contenido pendiente de las cinco rutas y página 404                      |
| `Brand`           | Marca tipográfica provisional y enlace al inicio                         |
| `Button`          | Apariencia reutilizable sobre enlaces y botones nativos                  |
| `SiteNav`         | Navegación semántica y estado de página actual                           |
| `Icon`            | Iconos SVG decorativos con nombres tipados                               |

Los tokens de color y tipografía se centralizan en `@theme`; espaciado de
secciones, contenedor y tiempos de transición se definen en `:root` de
`src/styles.css`. Las utilidades existentes de Tailwind resuelven grids,
separaciones y cambios de layout. Los estilos de cada componente resuelven su
composición específica.

Se utilizan fuentes del sistema, SVG local ligero y `NgOptimizedImage` con
dimensiones explícitas y prioridad para la imagen principal. El SVG es escalable,
por lo que no necesita variantes raster ni un proveedor externo de imágenes.
Su leyenda lo identifica como exploración visual, no como un proyecto ejecutado.

Se incluyen landmarks semánticos, un h1 por página, navegación identificada,
enlaces nativos, botones con nombre accesible, `aria-current`, `aria-expanded`,
foco visible, orden natural de tabulación y respeto de `prefers-reduced-motion`.
El menú móvil es una navegación desplegable no modal: no requiere trampa de foco.

## Rutas y renderizado

| Ruta                     | Página                                    | Renderizado |
| ------------------------ | ----------------------------------------- | ----------- |
| `/`                      | Inicio completo                           | Prerender   |
| `/eventos`               | Organización de eventos, provisional      | Prerender   |
| `/impresiones`           | Gigantografías e impresiones, provisional | Prerender   |
| `/portafolio`            | Pendiente de proyectos autorizados        | Prerender   |
| `/cotizaciones`          | Aviso de solicitudes aún no habilitadas   | Prerender   |
| `/contacto`              | Pendiente de canales confirmados          | Prerender   |
| Cualquier otra dirección | Página 404 y HTTP 404                     | SSR         |

El layout, inicio y componente provisional se cargan con `loadComponent`.
La información de rutas provisionales se mantiene junta para evitar repetir
componentes idénticos. Cada funcionalidad podrá reemplazar su ruta de forma
independiente al implementar las siguientes etapas.

`SeoTitleStrategy` actualiza título, descripción, Open Graph y robots tanto en
servidor como al navegar. Las páginas provisionales y la 404 tienen
`noindex, follow`. Los parámetros de consulta no pueden sustituir el contenido
pasado al componente mediante datos de ruta.

Se mantiene la hidratación existente. El foco solo se modifica en el navegador,
después de `afterNextRender`; no se accede directamente a `window`, `document`
ni `localStorage` desde la aplicación.

Se mantiene el servidor para la respuesta 404. Las futuras páginas dinámicas
podrán declarar `RenderMode.Server`; la futura administración deberá declarar
`RenderMode.Client` en su propio árbol de rutas cuando exista. No se creó ninguna
ruta administrativa ni pantalla de autenticación.

## Preparación HTTP para Spring Boot

- `provideHttpClient` usa el backend Fetch predeterminado de Angular 22, sin
  añadir el antiguo `withFetch()` innecesario.
- `API_BASE_URL` obtiene `/api/v1` de la configuración de entorno. La compilación
  de desarrollo sustituye `environment.ts` por `environment.development.ts`.
- `ApiClient` prepara GET y POST genéricos tipados. Los futuros servicios de cada
  funcionalidad definirán sus propios contratos y reglas de negocio.
- `apiErrorInterceptor` transforma errores de la API en `ApiError`, conserva el
  estado y la causa y no produce respuestas de éxito ni reintentos implícitos.
  Las peticiones fuera de la URL base conservan sus errores originales.
- `ApiProblem` propone un contrato de error RFC 9457 para confirmar con backend.
  No se inventan endpoints de negocio ni contratos de cotización definitivos.
- Instanciar el cliente no genera peticiones. Ninguna página utiliza todavía
  esta infraestructura para enviar datos.

En integración deberá configurarse el reverse proxy de `/api/v1` o una URL
absoluta de backend y CORS, según el entorno. Si una futura página SSR consume
la API, necesitará una URL absoluta accesible desde el servidor; la URL relativa
actual está preparada para el navegador y un proxy del mismo origen.
No se modificó el backend ni se añadieron secretos.

## Validación ejecutada

| Comprobación                                                     | Resultado                                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `npm.cmd run build -- --configuration production`                | Aprobada; seis rutas prerenderizadas, sin errores ni avisos de presupuestos |
| `npm.cmd test -- --watch=false`                                  | 14 pruebas aprobadas en cuatro archivos                                     |
| `npm.cmd run check:types`                                        | Aplicación y pruebas sin errores TypeScript                                 |
| Prettier sobre archivos implementados y configuración modificada | Formato comprobado                                                          |
| `npm.cmd run check:browser`                                      | Comprobaciones locales de producción en Chrome aprobadas                    |

La compilación final genera aproximadamente 308.70 kB iniciales, con transferencia
estimada de 85.50 kB. El inicio y el layout se mantienen en chunks lazy separados.

Las pruebas unitarias cubren montaje, navegación por las seis páginas y 404,
metadatos por página, aislamiento frente a parámetros de consulta, ausencia de
formulario ficticio, menú móvil/Escape/cambio de ruta, GET/POST tipados,
propagación de errores HTTP 400/404/500, errores de red y alcance del interceptor.
Las respuestas simuladas de HTTP existen exclusivamente en las pruebas mediante
`HttpTestingController`.

La comprobación de Chrome se ejecuta contra el servidor de producción e incluye:

- Las seis rutas devuelven HTTP 200 con contenido, idioma y metadatos en el HTML,
  sin necesitar JavaScript. Una ruta inexistente devuelve HTTP 404 y `noindex`.
- Inicio sin desbordamiento horizontal a 320, 375, 768, 1024 y 1440 px; imagen
  cargada y navegación apropiada para cada ancho.
- Hidratación real del menú, tabulación hacia navegación, Escape con retorno
  del foco y cierre al navegar; foco del contenido y página actual.
- Rutas provisionales en móvil, enlace de salto por teclado, ancla de servicios,
  contraste AA del texto visible y reducción de movimiento.
- Landmarks y h1 presentes en el árbol de accesibilidad de Chrome.
- Ausencia de errores y avisos en la consola, fallos de hidratación y llamadas a
  la futura API.

También se inspeccionaron visualmente capturas de escritorio y móvil. Las
capturas y el resultado JSON se guardan en `tmp/browser-qa/`, fuera del código
versionable. La comprobación usa Chrome/Edge instalado y el protocolo CDP nativo
de Node; no instala paquetes. En este entorno el navegador necesitó ejecutarse
fuera del sandbox porque sus procesos no podían iniciarse dentro de él.

## Límites y siguiente revisión

- La identidad es provisional; hacen falta nombre comercial, logotipo, colores
  oficiales, datos de contacto y contenido validado por la empresa.
- Las cinco páginas secundarias siguen siendo provisionales. Cotizaciones no
  recibe datos, no contiene formulario ni promete una entrega exitosa.
- Antes de publicar, añadir el dominio real a la configuración de hosts o a
  `NG_ALLOWED_HOSTS`, y configurar URL canónica, imagen social y sitemap con ese
  dominio. No se inventó un dominio de producción.
- La accesibilidad comprobada es básica y automatizada, complementada con
  revisión visual. No equivale a una auditoría WCAG completa con lector de
  pantalla ni a una ejecución de axe. No se probaron Safari ni Firefox.
- No se añadieron dependencias ni se cambió la versión principal de Angular.
  No se realizaron commits, push, despliegues, autenticación, pagos ni dashboard.
- El árbol del frontend ya aparecía sin seguimiento en Git al iniciar; no se
  alteró el índice del repositorio.

El siguiente paso es revisar esta etapa y confirmar la identidad y el contenido.
Después podrán desarrollarse las páginas de servicios y el portafolio; los
formularios deben esperar a acordar contratos y disponer de integración real.
La implementación se detiene en este punto para esa revisión.

## Referencias oficiales consultadas

- [Prerender, SSR e hidratación](https://angular.dev/guide/ssr).
- [Rutas y carga de componentes](https://angular.dev/guide/routing/define-routes).
- [TitleStrategy](https://angular.dev/api/router/TitleStrategy).
- [Interceptores funcionales](https://angular.dev/guide/http/interceptors).
- [Tailwind con Angular](https://angular.dev/guide/tailwind).
- [Hosts permitidos en SSR](https://angular.dev/best-practices/security#configuring-allowed-hosts).
- Guía local de buenas prácticas incluida en `node_modules/@angular/core/resources/best-practices.md`.

## Continuación: servicios y portafolio — 20 de noviembre de 2026

El usuario confirmó que Sanabria Group organiza y produce eventos musicales
de cumbia y folklore, y realiza paneles, pasacalles y gigantografías. Estas líneas
se incorporaron al inicio, a las páginas de servicios y a sus metadatos.

### Cambios realizados

- `/eventos` tiene una página de eventos musicales, presentación de cumbia y
  folklore, una guía para preparar el proyecto, preguntas frecuentes y enlace
  a los servicios de impresión.
- `/impresiones` presenta paneles, pasacalles y gigantografías. Incluye una guía
  sobre la información necesaria para plantear el proyecto, preguntas frecuentes
  y enlace a eventos.
- `/portafolio` tiene una página independiente con un estado vacío explícito,
  enlaces a los servicios y aviso sobre la publicación de trabajos autorizados.
  No se inventaron proyectos, clientes, fotografías, testimonios ni cifras.
- Se añadieron migas de navegación y un componente reutilizable de llamada
  a cotizaciones. El estado de las solicitudes en línea sigue siendo visible.
- Las dos ilustraciones SVG son locales, ligeras y están identificadas como
  conceptuales. Se utilizan con `NgOptimizedImage` y dimensiones explícitas.

### Arquitectura y estructura añadida

```text
src/app/
├── features/
│   ├── services/
│   │   ├── service-content.ts
│   │   ├── service-detail.ts
│   │   ├── service-detail.html
│   │   ├── service-detail.css
│   │   └── services.routes.ts
│   └── portfolio/
│       ├── portfolio.ts
│       ├── portfolio.html
│       └── portfolio.css
└── shared/ui/
    ├── breadcrumbs/breadcrumbs.ts
    └── project-cta/project-cta.ts
public/images/
├── events-concept.svg
└── print-concept.svg
```

`ServiceDetail` presenta el contenido tipado que recibe mediante datos de ruta e
inputs. `service-content.ts` conserva el contenido fuera del componente visual.
`Portfolio` reutiliza esas definiciones para enlazar a las dos líneas de negocio.
No se añadieron servicios que simulen un catálogo remoto ni datos de proyectos.

Las preguntas frecuentes utilizan `details` y `summary` nativos; no requieren
estado JavaScript ni dependencias adicionales. Las rutas mantienen `loadComponent`
y prerender. Eventos e impresiones pasan a `index, follow`; el portafolio vacío,
contacto, cotizaciones y la página 404 mantienen `noindex, follow`.

### Validación de esta continuación

| Comprobación         | Resultado                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Producción           | Compilación aprobada, seis rutas prerenderizadas, sin avisos de presupuestos                                |
| Pruebas unitarias    | 16 aprobadas en cuatro archivos                                                                             |
| TypeScript           | Aplicación y pruebas sin errores                                                                            |
| Navegación en Chrome | Migas, enlaces entre servicios, portafolio y cotizaciones aprobados                                         |
| Responsive           | Inicio y las tres páginas nuevas comprobados a 320, 375, 768, 1024 y 1440 px, sin desbordamiento horizontal |
| Teclado              | Apertura de preguntas frecuentes con Enter, menú móvil, Escape y salto al contenido comprobados             |
| SSR y SEO            | HTML sin JavaScript, un h1 por página, metadatos y HTTP 404 comprobados                                     |
| Accesibilidad básica | Contraste del texto visible, landmarks, foco y reducción de movimiento comprobados                          |
| Consola y API        | Sin errores o avisos de navegador, fallos de hidratación ni llamadas a `/api/v1`                            |

El bundle inicial queda en aproximadamente 313.48 kB, con transferencia estimada
de 86.75 kB. Las páginas de servicios y portafolio tienen chunks lazy propios.
Las ilustraciones nuevas ocupan en conjunto aproximadamente 3.3 kB.

El script de navegador ahora comprueba las tres páginas nuevas en todos los
anchos indicados, sus controles nativos y la navegación entre ellas. También
guarda capturas de móvil y escritorio para cada página en `tmp/browser-qa/`.
La simulación de Enter incluye el evento de carácter que utiliza la activación
nativa de `summary` en Chrome.

La validación de accesibilidad es básica; no sustituye una auditoría completa con
lector de pantalla ni pruebas en Firefox o Safari.

### Pendientes

Faltan fotografías y descripciones autorizadas para publicar proyectos reales,
materiales y acabados de impresión confirmados, y los datos de contacto de la
empresa. Los formularios de cotización y la recepción de archivos siguen
pendientes de la integración funcional con Spring Boot. No se modificó el
backend, no se añadieron dependencias y no se realizaron commits ni despliegues.

## Continuación: calculadora de cotizaciones — 20 de noviembre de 2026

El usuario solicitó habilitar el cálculo de gigantografías por metro cuadrado,
con medidas y precio editables, más listones opcionales con su precio. Esta
petición autoriza una calculadora local; las solicitudes persistentes, la
recepción de archivos y la integración con backend siguen pendientes.

### Comportamiento implementado

- Ancho y alto en metros, con hasta tres decimales.
- Precio por m² en soles, editable para cada cotización y con hasta dos decimales.
- Casilla para incluir listones; al activarla aparece su precio total adicional.
  Se suma una sola vez y se excluye al desactivar la casilla.
- Resumen con medidas, área, precio unitario, subtotal de impresión, listones y
  total estimado. El total se actualiza automáticamente y tiene anuncio accesible.
- Ejemplo inicial autorizado: `7 × 3 = 21 m²`; `21 × S/ 10 = S/ 210`.
  Se identifica como ejemplo editable y no como tarifa oficial de la empresa.
- Se aceptan decimales con punto o coma. Los valores vacíos, negativos, cero en
  medidas o precio por m² y la precisión excesiva muestran errores por campo.
- El precio de listones solo se valida cuando están activados. Puede ingresarse
  cero explícitamente; dejarlo vacío impide mostrar un total incompleto.
- Un botón restaura el ejemplo y limpia los errores. No hay envío, almacenamiento
  local, generación de números de cotización ni llamadas a la API.

### Arquitectura añadida

```text
src/app/features/quotes/
├── quote-calculation.ts
├── quote-calculation.spec.ts
├── quote-schema.ts
├── quote-input.ts
├── quotes.ts
├── quotes.html
├── quotes.css
└── quotes.spec.ts
```

La lógica de negocio y el formateo exacto de números quedan en funciones puras.
Se representan las dimensiones en milímetros, el área en milímetros cuadrados
y los precios en centavos mediante `BigInt`. El subtotal de impresión se redondea
al centavo más cercano, con los medios centavos hacia arriba, antes de sumar el
importe total de listones. El área no se redondea antes de calcular el precio.

El componente utiliza signals, `computed()` y Signal Forms, ya incluido en la
dependencia Angular existente. El esquema de validación está separado de los
componentes visuales. `QuoteInput` reutiliza etiquetas, unidades, ayuda y errores
accesibles. Los nombres de los controles los administra `FormField`.

`/cotizaciones` conserva carga lazy y prerender, pasa a `index, follow` y tiene
metadatos propios. Se actualizaron las llamadas a la acción y las preguntas
frecuentes que antes indicaban que esta página estaba en preparación.

### Validación de la calculadora

- Producción aprobada con seis rutas prerenderizadas y sin avisos de presupuestos.
- 41 pruebas unitarias aprobadas en seis archivos. Incluyen el ejemplo, cambios de
  precio, listones, decimales con coma, redondeo, importes grandes, entradas
  inválidas, actualización del formulario y restablecimiento.
- TypeScript y formato comprobados para los archivos implementados.
- Chrome comprobó la calculadora a 320, 375, 768, 1024 y 1440 px, sin
  desbordamiento. Se inspeccionaron capturas de móvil y escritorio.
- Se verificaron la activación de listones con teclado, cambios de precio,
  valores decimales, errores accesibles, eliminación de totales desactualizados,
  restablecimiento y ausencia de envío al pulsar Enter.
- La revisión de contraste, navegación, hidratación y consola pasó; no hubo
  solicitudes a `/api/v1`.

Las capturas se guardan como `cotizaciones-375.png`, `cotizaciones-1440.png` y
`cotizaciones-listones-375.png` en `tmp/browser-qa/`. La comprobación de
accesibilidad sigue siendo básica y no sustituye una auditoría completa con
lector de pantalla ni pruebas en otros navegadores.

No se modificó el backend, no se instalaron dependencias y no se realizaron
commits, push ni despliegues.

## Continuación: cotizaciones con varios ítems — 20 de noviembre de 2026

Se amplió la calculadora para completar el bloque de múltiples ítems y resumen
general. Cada ítem admite descripción opcional, cantidad, ancho, alto, precio
por metro cuadrado y listones opcionales. La edición se realiza en los campos;
los botones permiten agregar y eliminar ítems.

### Reglas de cálculo y edición

- La cantidad debe ser un entero positivo y multiplica el área de impresión.
  Las medidas corresponden a cada pieza del ítem.
- El precio de listones representa el importe total de todas las piezas de ese
  ítem. Se suma una sola vez y se excluye si los listones están desactivados.
- La impresión se redondea una vez por ítem, considerando toda su cantidad,
  antes de sumar listones. El total general suma los subtotales ya redondeados.
- Un ítem incompleto o inválido mantiene pendiente el total general; los otros
  ítems conservan su desglose. Al eliminar todos los ítems no se presenta una
  cotización de importe cero, sino un estado vacío.
- Las descripciones son opcionales y admiten hasta 160 caracteres. Un ítem sin
  descripción se identifica por su posición en el resumen.
- Los ítems nuevos tienen cantidad uno y sus medidas y precio vacíos. El
  ejemplo inicial conserva una pieza de `7 × 3 m` a `S/ 10/m²`, total `S/ 210`.
- El restablecimiento recupera un solo ítem de ejemplo y elimina errores previos.

Caso comprobado: dos piezas de `7 × 3 m` a `S/ 10/m²` más `S/ 20` de listones
suman `S/ 440`. Tres piezas de `2 × 1 m` a `S/ 15/m²` suman `S/ 90`.
El resumen general muestra cinco piezas, `48 m²`, impresión por `S/ 510`,
listones por `S/ 20` y un total de **S/ 530**.

### Organización del código

Se añadieron `quote-document.ts`, `quote-document.spec.ts` y los tres archivos
`quote-item-editor.ts`, `quote-item-editor.html` y `quote-item-editor.css` en
`src/app/features/quotes/`.

`quote-calculation.ts` conserva el cálculo exacto por ítem con `BigInt`.
`quote-document.ts` calcula los agregados y el estado general sin dependencias
de Angular. `QuoteItemEditor` presenta un ítem y emite su eliminación; `Quotes`
coordina el arreglo, la validación y el resumen.

El esquema utiliza `applyEach` de Signal Forms para aplicar validación a los
ítems agregados dinámicamente. El renderizado sigue la identidad de los campos;
los identificadores de ítem son locales, estables y no representan números de
cotización del backend.

Al agregar un ítem, el foco pasa a su descripción. Al eliminar uno pasa al
siguiente disponible y, al eliminar el último, vuelve al botón de agregar.
El acceso al botón nativo usa `ElementRef` explícitamente; los callbacks de foco
se ejecutan después del renderizado y no se ejecutan en SSR.

El total general aparece al inicio del resumen. En escritorio, el panel tiene
desplazamiento para conservar acceso al detalle de cotizaciones largas.

### Verificación de esta ampliación

- Compilación de producción aprobada con las seis rutas prerenderizadas y sin
  avisos de presupuestos.
- 57 pruebas unitarias aprobadas en siete archivos. Se cubren cantidades,
  agregación de ítems, listones sumados una vez, redondeo por ítem, estados
  incompletos y vacíos, edición, eliminación intermedia y restablecimiento.
- TypeScript y formato comprobados para los archivos modificados.
- Chrome comprobó el flujo completo y la presentación de varios ítems a
  320, 375, 768, 1024 y 1440 px, sin desbordamiento horizontal ni IDs duplicados.
- Se verificó que eliminar un ítem con errores no traslade sus valores o
  validación a otro, y que el foco se conserve al agregar o eliminar.
- Sin errores o avisos de consola, fallos de hidratación ni llamadas a la API.

Las capturas de varios ítems se guardan en
`tmp/browser-qa/cotizaciones-varios-items-375.png` y
`tmp/browser-qa/cotizaciones-varios-items-1440.png`.

La cotización sigue siendo local. Los datos del cliente, PDF y persistencia con
Spring Boot corresponden a bloques posteriores. No se modificó el backend ni
se añadieron dependencias, commits o despliegues.
