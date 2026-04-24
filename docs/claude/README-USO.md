# Cómo Usar Este Paquete con Claude Code

## Orden de ejecución recomendado

1. **Creá un repo Git vacío** para el proyecto (`educai/` en GitHub).
2. **Copiá todos estos archivos** dentro del repo, en una carpeta `docs/claude/`.
3. **Creá un archivo `CLAUDE.md`** en la raíz del repo con el contenido de `00-PROYECTO-MAESTRO.md`.
4. **Iniciá Claude Code** en la carpeta del repo:
   ```bash
   cd educai
   claude
   ```
5. **Pegá los prompts en orden**, uno por uno, validando cada fase antes de pasar a la siguiente.

---

## Cómo pegar los prompts

Cada archivo `02-FASE-1-APOYOAI.md`, `03-FASE-2-EDUCAI.md`, etc. tiene bloques de código ```...``` con los prompts listos. Copialos y pegalos directamente en Claude Code.

**Ejemplo de sesión típica:**

```bash
# Terminal 1 — Claude Code
cd educai
claude

# Pegás: "Leé docs/claude/00-PROYECTO-MAESTRO.md y docs/claude/01-FASE-0-SETUP.md. Después ejecutá el prompt que está al final del 01."

# Claude Code lee los archivos, entiende el contexto, y genera todo el monorepo.

# Al terminar, validás con:
pnpm install
pnpm dev
```

---

## Estrategia para no quemar créditos

Claude Code puede consumir muchos tokens si le pedís todo de una. Estrategia recomendada:

### Por sesión
- Una fase completa, no el proyecto entero.
- Cerrá la sesión al terminar una fase (`/clear` en Claude Code).
- Abrí nueva sesión para la fase siguiente.

### Checkpoints de Git
- Commit después de cada prompt exitoso.
- Si algo sale mal, `git reset --hard` y reintentá con prompt ajustado.

### Validación incremental
- Después de cada prompt: corré tests, typecheck, lint.
- No avances si algo está roto.

---

## Tips específicos

### Para el setup (Fase 0)
Pegá el prompt y dejá que corra. Probablemente te pida credenciales de Supabase, Twilio, etc. Tené a mano:
- Cuenta Supabase (proyecto creado)
- Cuenta Twilio (con número de WhatsApp sandbox)
- Cuenta MercadoPago desarrolladores
- Cuenta Anthropic (API key)
- Cuenta OpenAI (API key)
- Cuenta Vercel
- Cuenta GitHub

### Para los módulos con IA (Fase 1 en adelante)
Los prompts pedagógicos son el corazón del producto. Iterá sobre ellos:
1. Claude Code genera la versión inicial.
2. Testeá con 10 casos reales.
3. Ajustá el system prompt.
4. Re-testeá.
5. Repetí hasta que pase los 10 casos.

### Para validación pedagógica
**Contratá o consultá con 1-2 pedagogos** antes del lanzamiento público. El código puede estar perfecto y el prompt puede estar mal. Los pedagogos no son opcionales.

### Para el módulo BienestAR (salud mental)
**Jamás lances sin revisión de 2 profesionales de salud mental**. Incluso si el código está impecable. Es el módulo más sensible del proyecto.

---

## Recursos externos a conseguir

### Legales
- Modelo de consentimiento parental.
- Política de privacidad específica para datos de menores.
- Términos y condiciones con cláusulas de IA.
- Acuerdo de procesamiento de datos (DPA) para colegios.

### Pedagógicos
- Marcos curriculares oficiales de Argentina, Bolivia, Paraguay, Perú (para RAG).
- Rúbricas de referencia.
- Validadores pedagógicos (consejo académico).

### Partnerships
- Ministerio de Educación de Catamarca (cliente ancla).
- Universidades (UNCa, UNT, UNSa) para validación científica.
- ONGs educativas (Varkey, Luminos, Cimientos).
- Fundaciones para financiamiento (Repsol, Telefónica, BID Lab).

---

## Secuencia de lanzamiento sugerida

### Mes 1-2
- Fase 0: Setup completo.
- Prompt 1 y 2 de Fase 1: perfil de alumno + motor de tutor.

### Mes 3
- Prompt 3, 4, 5 de Fase 1: diagnóstico, pagos, reportes.
- **Soft launch ApoyoAI** con 10 familias beta.

### Mes 4-5
- Iteración sobre feedback.
- **Launch público ApoyoAI**.
- Arranca Fase 2 en paralelo.

### Mes 6-7
- Fase 2 (EducAI MVP) con 3-5 colegios piloto.

### Mes 8-10
- Fase 3 (módulos transversales).
- ApoyoAI debería estar en 500-1000 familias.

### Mes 11-14
- Fase 4 (B2G, expansión).
- Primera licencia provincial.

---

## Archivos incluidos en este paquete

| Archivo | Contenido |
|---------|-----------|
| `00-PROYECTO-MAESTRO.md` | Contexto completo, visión, stack, arquitectura |
| `01-FASE-0-SETUP.md` | Setup del monorepo con prompt para Claude Code |
| `02-FASE-1-APOYOAI.md` | MVP ApoyoAI con 5 prompts detallados |
| `03-FASE-2-EDUCAI.md` | MVP EducAI institucional con 4 prompts |
| `04-FASE-3-EXPANSION.md` | 8 prompts de módulos transversales |
| `05-FASE-4-B2G-EXPANSION.md` | 6 prompts para sector público y expansión |
| `README-USO.md` | Este archivo |

---

## Soporte

Si algún prompt no genera lo esperado:
1. Revisá que Claude Code haya leído los archivos de contexto (`CLAUDE.md` + los `docs/claude/`).
2. Especificá más: en vez de "mejorá esto", decí "en el archivo X, línea Y, quiero que Z".
3. Si es problema de arquitectura, volvé al maestro y ajustá ahí primero.
4. Mantené un `docs/decisions/` con ADRs cuando cambies algo importante.

**Última sugerencia:** tratá este paquete como un organismo vivo. A medida que construyas, vas a descubrir cosas que acá no están. Volvé y actualizá los archivos. Tu próximo yo te lo agradece.
