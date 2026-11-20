# Frontend — Sanabria Group

Frontend comercial sobre el proyecto existente: Angular 22, standalone,
TypeScript estricto, Tailwind 4 y renderizado híbrido. Incluye el inicio,
las páginas de eventos musicales e impresión, una calculadora de cotización de
gigantografías y un portafolio pendiente de proyectos autorizados.

El [informe de entrega](docs/etapa-1.md) incluye auditoría, versiones instaladas,
árbol de carpetas, componentes, rutas, arquitectura, validaciones y pendientes.
La continuación del 20 de noviembre de 2026 está documentada al final del informe.

## Desarrollo

```powershell
npm.cmd start
```

Abrir `http://localhost:4200/`. En Windows se utiliza `npm.cmd` para evitar depender
de la política de ejecución de scripts de PowerShell. En otras plataformas puede
utilizarse `npm`.

Las dependencias existentes no se modificaron. En una copia nueva del proyecto,
usar `npm.cmd ci` antes de ejecutar los comandos.

### Recuperar un prebundle desactualizado de Vite

`ERR_OUTDATED_OPTIMIZED_DEP` indica que una petición SSR está utilizando una
versión anterior de las dependencias optimizadas. Si la aplicación ya responde,
recargar la página con `Ctrl+F5`.

Si el error persiste, detener primero `ng serve` con `Ctrl+C` en su terminal y
ejecutar desde esta carpeta:

```powershell
npm.cmd run ng -- cache clean
npm.cmd start
```

Después, recargar la página. No limpiar la caché mientras el servidor sigue
ejecutándose ni iniciar dos servidores del mismo proyecto durante la recuperación.
Este procedimiento conserva las dependencias y la configuración SSR.
Ver las referencias de [caché](https://angular.dev/cli/cache/clean) y
[prebundling de Angular](https://angular.dev/tools/cli/build-system-migration#prebundling).

## Compilación y comprobaciones

```powershell
npm.cmd run build -- --configuration production
npm.cmd test -- --watch=false
npm.cmd run check:types
npm.cmd run check:browser
```

`check:browser` requiere una compilación de producción previa y Chrome o Edge
instalado. Se puede indicar otro ejecutable mediante `CHROME_PATH`. Inicia y
detiene su propio servidor y navegador; guarda capturas y resultados locales en
`tmp/browser-qa/`, ignorado por Git. Un sandbox que impida iniciar el navegador
puede requerir permisos para ejecutar esta comprobación fuera de él.

Para comprobar un servidor de desarrollo que ya esté ejecutándose:

```powershell
$env:BROWSER_QA_ORIGIN = 'http://localhost:4200'
npm.cmd run check:browser
Remove-Item Env:BROWSER_QA_ORIGIN
```

En este modo no inicia ni detiene el servidor existente y no requiere compilar
producción. Guarda sus resultados en `tmp/browser-qa/development/`.

Para ejecutar el servidor de producción manualmente:

```powershell
npm.cmd run serve:ssr:frontend
```

Abrir `http://localhost:4000/`. Las seis rutas comerciales se prerenderizan; las
direcciones inexistentes responden con una página SSR y estado HTTP 404.

## Rutas

| Ruta            | Estado                                                                                 |
| --------------- | -------------------------------------------------------------------------------------- |
| `/`             | Inicio con los servicios confirmados de Sanabria Group                                 |
| `/eventos`      | Eventos musicales de cumbia y folklore, guía de preparación y preguntas frecuentes     |
| `/impresiones`  | Paneles, pasacalles y gigantografías, guía de preparación y preguntas frecuentes       |
| `/portafolio`   | Página propia con un estado vacío hasta disponer de trabajos autorizados               |
| `/cotizaciones` | Cotización local con varios ítems, cantidades, precios editables y listones opcionales |
| `/contacto`     | Provisional; pendiente de canales de atención confirmados                              |

Las seis páginas se prerenderizan. Eventos, impresiones y cotizaciones permiten
indexación; el portafolio conserva `noindex` hasta que tenga proyectos publicados.

El contenido de los servicios se mantiene en
`src/app/features/services/service-content.ts`. Las ilustraciones SVG son
conceptuales y no se presentan como trabajos de clientes.

## Calculadora de cotizaciones

En `/cotizaciones` puedes agregar, editar y eliminar varios ítems. Cada ítem
agrupa piezas con la misma descripción, medidas y precio por metro cuadrado:

```text
Área del ítem = ancho en metros × alto en metros × cantidad
Impresión del ítem = área del ítem × precio por m²
Subtotal del ítem = impresión + precio total de listones, si están activados
Total general = suma de subtotales de todos los ítems
```

El ejemplo inicial usa `7 × 3 × S/ 10 = S/ 210`. Todos los valores son editables;
el precio de S/ 10 se presenta como ejemplo, no como una tarifa fija. Activar
listones muestra un campo para su importe total adicional por ítem. Ese importe
cubre todas las piezas del ítem y se suma una sola vez; no se multiplica por la
cantidad. Al desactivar los listones, su precio deja de sumarse.

Por ejemplo, dos piezas de `7 × 3 m` a `S/ 10/m²` más `S/ 20` de listones dan
`S/ 440`. Otro ítem con tres piezas de `2 × 1 m` a `S/ 15/m²` da `S/ 90`.
La cotización completa suma cinco piezas, `48 m²` y **S/ 530**.

Las medidas admiten hasta tres decimales y los precios hasta dos. Se acepta
punto o coma decimal. Las medidas y el precio por m² deben ser mayores que cero;
el precio de listones puede ser cero si se ingresa explícitamente. La cantidad
debe ser un entero mayor que cero. La descripción es opcional y admite hasta
160 caracteres. Los errores se muestran junto a los campos; el total general
queda pendiente mientras haya un ítem incompleto o inválido.

El cálculo utiliza enteros escalados y centavos con `BigInt`, redondea el
subtotal de impresión de todas las piezas de un ítem una sola vez y luego suma
sus listones. Finalmente suma los importes ya redondeados de todos los ítems.
La lógica está en `src/app/features/quotes/quote-calculation.ts` y
`quote-document.ts`; el formulario utiliza
[Signal Forms de Angular](https://angular.dev/guide/forms/signals/overview).
No se guardan ni se envían cotizaciones. El botón de restablecer recupera el
ejemplo de un solo ítem y limpia el estado de validación. Si eliminas todos los
ítems, se muestra un estado vacío y puedes comenzar nuevamente con «Agregar ítem».

## Configuración pendiente de integración

La URL pública de API se configura en `src/environments/environment.ts` y
`environment.development.ts`, inicialmente `/api/v1`. No hay llamadas de negocio,
formularios de envío, autenticación ni rutas administrativas.

Para una futura publicación, configurar el dominio real en `security.allowedHosts`
de `angular.json` o mediante `NG_ALLOWED_HOSTS`. También será necesario preparar
el proxy de API y los metadatos dependientes del dominio. Ver el informe antes de
iniciar la siguiente etapa.
