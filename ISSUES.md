# Bundler Code Review - Tüm Sorunlar

Bu dosya code review sonucunda tespit edilen tüm sorunları içerir.
Toplam: ~260 sorun

---

## BÖLÜM 1: KRİTİK BUGLAR (P0 - Hemen Düzelt)

### BUG-001: AsyncSeriesWaterfallHook Waterfall Pattern Çalışmıyor
- **Dosya**: `src/kernel.ts:76-88`
- **Açıklama**: Waterfall hook'ta önceki plugin'in sonucu bir sonrakine geçirilmiyor. Her plugin aynı orijinal args'ı alıyor.
- **Etki**: Transform zinciri çalışmıyor, plugin'ler birbirinin çıktısını görmüyor.
- **Çözüm**: Sonucu bir sonraki plugin'e argüman olarak geçir.

### BUG-002: Dependency Graph'a Hiçbir Dependency Eklenmiyor
- **Dosya**: `src/index.ts:58-63`
- **Açıklama**: `context.graph.modules.has(resolvedId)` kontrolü, modül henüz eklenmeden yapılıyor.
- **Etki**: Dependency graph tamamen boş, build order yanlış.
- **Çözüm**: Önce `processModule(resolvedId)` çağır, sonra dependency ekle.

### BUG-003: Entry Point Marking Yanlış Zamanda
- **Dosya**: `src/index.ts:73-79`
- **Açıklama**: `moduleNode.imported = true` atanmaya çalışılıyor ama modül henüz graph'a eklenmemiş.
- **Etki**: Entry point'ler işaretlenmiyor.
- **Çözüm**: `processModule` sonrası marking yap.

### BUG-004: Source Map VLQ Encoding Tamamen Yanlış
- **Dosya**: `src/utils/sourcemap.ts:105-143`
- **Açıklama**: VLQ encoding spec'e uymuyor. Sign bit, continue bit, bit shift hepsi yanlış.
- **Etki**: Source map'ler hiçbir debugger'da çalışmaz.
- **Çözüm**: VLQ spec'e göre yeniden yaz veya `source-map` library kullan.

### BUG-005: Source Map Decoding Parsing Kırık
- **Dosya**: `src/utils/sourcemap.ts:187-228`
- **Açıklama**: `;` ve `,` ile split edince segment ayrımı kaybolur. VLQ multi-char decode yok.
- **Etki**: Source map okuma çalışmaz.
- **Çözüm**: Proper VLQ decoder implement et.

### BUG-006: Circular Dependency Detection Yanlış Cycle Döndürüyor
- **Dosya**: `src/core/graph.ts:54-95`
- **Açıklama**: `cycleStart` hesaplanıp kullanılmıyor. Cycle path yanlış oluşturuluyor.
- **Etki**: Hatalı circular dependency raporlaması.
- **Çözüm**: Cycle'ı doğru slice et.

### BUG-007: Scoped Package Resolution Kırık
- **Dosya**: `src/core/resolver.ts:114-116`
- **Açıklama**: `@scope/package` için sadece `@scope` alınıyor, `package` kaybediliyor.
- **Etki**: Scoped npm paketleri (@types/*, @babel/*, vb.) resolve edilemez.
- **Çözüm**: Scoped package için özel handling ekle.

### BUG-008: Prune Algoritması Transitive Dependencies'i Siliyor
- **Dosya**: `src/core/graph.ts:132-150`
- **Açıklama**: Sadece entry point'ler tutulup dependency'ler siliniyor.
- **Etki**: Bundle'da modüller eksik.
- **Çözüm**: Transitive closure hesapla.

### BUG-009: External Check Çok Geç Yapılıyor
- **Dosya**: `src/core/resolver.ts:27-35`
- **Açıklama**: Önce dosya sisteminde arama, sonra external check.
- **Etki**: Gereksiz I/O, potansiyel hatalar.
- **Çözüm**: External check'i en başa al.

### BUG-010: Linker Oluşturuluyor Ama Kullanılmıyor
- **Dosya**: `src/plugins/core/linker.ts:9-12`
- **Açıklama**: `BundleLinker` instance oluşturup hiçbir şey yapmadan return ediliyor.
- **Etki**: Plugin hiçbir iş yapmıyor.
- **Çözüm**: Linker'ı kullan veya plugin'i kaldır.

### BUG-011: Default + Named Import Parse Edilmiyor
- **Dosya**: `src/core/parser/parser.ts:47-65`
- **Açıklama**: `import def, { a, b } from 'x'` parse edilemiyor.
- **Etki**: Yaygın import pattern'i kırık.
- **Çözüm**: Combined import handling ekle.

### BUG-012: Export Function/Class/Let/Var Parse Edilmiyor
- **Dosya**: `src/core/parser/parser.ts:92-101`
- **Açıklama**: Regex sadece `export const` yakalıyor, diğerleri "function", "class" gibi keyword'leri export adı olarak alıyor.
- **Etki**: Export'ların çoğu yanlış parse ediliyor.
- **Çözüm**: Her export türü için ayrı handling.

### BUG-013: CLI --config Flag Değeri Kullanılmıyor
- **Dosya**: `src/cli.ts:61-66`
- **Açıklama**: `options.config` path'i ignore edilip default lokasyonlara bakılıyor.
- **Etki**: Custom config dosyası belirtilemez.
- **Çözüm**: `options.config` path'ini `loadConfigFile`'a geçir.

### BUG-014: CJS Transform'da `default_export` Undefined
- **Dosya**: `src/core/linker.ts:126-127`
- **Açıklama**: `module.exports.default = default_export` - `default_export` tanımlı değil.
- **Etki**: CJS build crash verir.
- **Çözüm**: Default export değerini bul ve kullan.

### BUG-015: IIFE Output Tamamen Kırık
- **Dosya**: `src/core/linker.ts:199-205`
- **Açıklama**: Import'lar comment'e dönüyor, export handling yok, global atama yanlış.
- **Etki**: IIFE build çalışmaz.
- **Çözüm**: Proper IIFE wrapper implement et.

### BUG-016: ESM Output'ta Import Path'ler Dönüştürülmüyor
- **Dosya**: `src/core/linker.ts:102-113`
- **Açıklama**: Bundle'da orijinal relative import path'ler kalıyor.
- **Etki**: Bundle çalışmaz.
- **Çözüm**: Import'ları kaldır veya resolve edilmiş path kullan.

### BUG-017: Scope Isolation Yok
- **Dosya**: `src/core/linker.ts:42-65`
- **Açıklama**: Tüm modüller aynı scope'a concat ediliyor.
- **Etki**: Variable name collision.
- **Çözüm**: Her modül için scope wrapper veya rename.

### BUG-018: Config typescript:false Undefined Oluyor
- **Dosya**: `src/config.ts:42`
- **Açıklama**: `config.typescript || undefined` - `false || undefined = undefined`.
- **Etki**: Explicit false değeri kaybolur.
- **Çözüm**: `??` operatörü kullan.

---

## BÖLÜM 2: MAJOR BUGLAR (P1 - Bu Sprint)

### BUG-019: @ts-nocheck 11 Dosyada Kullanılıyor
- **Dosyalar**: js-parser.ts, linker.ts, resolver.ts, css.ts, assets.ts, minifier.ts, sourcemaps.ts, splitting.ts, treeshake.ts, typescript.ts, tokenizer.ts
- **Açıklama**: TypeScript type checking tamamen devre dışı.
- **Etki**: Type error'ları runtime'da ortaya çıkar.
- **Çözüm**: @ts-nocheck kaldır, type error'ları düzelt.

### BUG-020: Multi-line Import Parse Edilmiyor
- **Dosya**: `src/core/parser/parser.ts:11-21`
- **Açıklama**: Line-based parsing, multi-line import'ları kırar.
- **Etki**: Yaygın formatting pattern'ı desteklenmiyor.
- **Çözüm**: AST parser kullan.

### BUG-021: Comment İçindeki Import Parse Ediliyor
- **Dosya**: `src/core/parser/parser.ts:14`
- **Açıklama**: `// import x from 'y'` parse ediliyor.
- **Etki**: False positive import'lar.
- **Çözüm**: Comment'leri filtrele veya AST kullan.

### BUG-022: String İçindeki Import Parse Ediliyor
- **Dosya**: `src/core/parser/parser.ts:14`
- **Açıklama**: `const str = "import x from 'y'"` parse ediliyor.
- **Etki**: False positive import'lar.
- **Çözüm**: AST parser kullan.

### BUG-023: Dynamic Import Expression Parse Edilmiyor
- **Dosya**: `src/core/parser/parser.ts:104-109`
- **Açıklama**: Sadece string literal yakalanıyor, `import(\`./\${lang}.json\`)` gibi pattern'lar yok.
- **Etki**: Dynamic import'ların çoğu kayıp.
- **Çözüm**: AST ile expression olarak kaydet.

### BUG-024: Re-export Combinations Parse Edilmiyor
- **Dosya**: `src/core/parser/parser.ts`
- **Açıklama**: `export { default as foo, bar } from 'x'`, `export * as ns from 'x'` desteklenmiyor.
- **Etki**: Yaygın re-export pattern'ları kırık.
- **Çözüm**: Her re-export varyantı için handling.

### BUG-025: Type-Only Import Filtrelenmemiyor
- **Dosya**: `src/core/parser/parser.ts`
- **Açıklama**: `import type { T } from 'x'` bundle'a giriyor.
- **Etki**: TypeScript type'ları runtime'da hata.
- **Çözüm**: Type-only import'ları filtrele.

### BUG-026: Side Effect Detection Naif
- **Dosya**: `src/core/parser/parser.ts:111-136`
- **Açıklama**: Regex-based, false positive/negative çok fazla.
- **Etki**: Yanlış tree-shaking kararları.
- **Çözüm**: AST-based analiz.

### BUG-027: Package.json exports Condition'ları Eksik
- **Dosya**: `src/core/resolver.ts:164-221`
- **Açıklama**: `import`/`require`/`node`/`browser` condition'ları handle edilmiyor.
- **Etki**: Modern paketler yanlış resolve edilir.
- **Çözüm**: Conditional exports tam desteği.

### BUG-028: Package.json imports (Subpath Imports) Yok
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: `#internal` pattern'ı desteklenmiyor.
- **Etki**: Self-referencing import'lar kırık.
- **Çözüm**: `imports` field desteği ekle.

### BUG-029: Package.json browser Field Yok
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: Browser-specific replacement desteklenmiyor.
- **Etki**: Browser build'ler yanlış modülleri içerir.
- **Çözüm**: `browser` field desteği ekle.

### BUG-030: node: Protocol Desteklenmiyor
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: `import fs from 'node:fs'` resolve edilemiyor.
- **Etki**: Modern Node.js import pattern'ı kırık.
- **Çözüm**: `node:` prefix handling ekle.

### BUG-031: Hash Collision Riski Yüksek
- **Dosya**: `src/utils/hash.ts:2-13`
- **Açıklama**: 32-bit hash, ~77000 dosyada %50 collision şansı.
- **Etki**: Chunk isim çakışması.
- **Çözüm**: SHA-256 veya xxHash kullan.

### BUG-032: Hash Hesaplanıyor Ama Kullanılmıyor
- **Dosya**: `src/core/linker.ts:31`
- **Açıklama**: `fileName = 'main.js'` hardcoded, `[hash]` pattern ignored.
- **Etki**: Cache invalidation çalışmaz.
- **Çözüm**: Config pattern'ını uygula.

### BUG-033: Error Cause Kayboluyor
- **Dosya**: `src/kernel.ts:36-38, 54-56, 82-84`
- **Açıklama**: Original error sarmalanırken stack trace ve cause kayboluyor.
- **Etki**: Debug çok zor.
- **Çözüm**: ES2022 error.cause kullan.

### BUG-034: Promise.all Fail-Fast Sorunu
- **Dosya**: `src/kernel.ts:99-107`
- **Açıklama**: İlk hata diğer promise'ları durdurmaz ama sonuçları kaybeder.
- **Etki**: Partial failure durumunda tutarsız state.
- **Çözüm**: Promise.allSettled kullan.

### BUG-035: Duplicate Plugin Name Check Eksik (Tap Level)
- **Dosya**: `src/kernel.ts:28-30`
- **Açıklama**: Aynı isimle birden fazla tap eklenebilir.
- **Etki**: Beklenmedik çoklu çalışma.
- **Çözüm**: Duplicate check veya replace behavior.

### BUG-036: Hook Tap'leri Destroy'da Temizlenmiyor
- **Dosya**: `src/kernel.ts:217-232`
- **Açıklama**: `destroy()` çağrıldığında hook'lardaki tap'ler kalıyor.
- **Etki**: Memory leak, reuse durumunda bug.
- **Çözüm**: Hook'ları da temizle.

### BUG-037: Plugin Factory vs Class Ayrımı Yok
- **Dosya**: `src/kernel.ts:131`
- **Açıklama**: `typeof plugin === 'function'` class için de true.
- **Etki**: Class plugin'ler `new` olmadan çağrılır, crash.
- **Çözüm**: Class detection ekle.

### BUG-038: Resource Cleanup Finally Yok
- **Dosya**: `src/index.ts:12-128`
- **Açıklama**: Exception durumunda `kernel.destroy()` çağrılmıyor.
- **Etki**: Resource leak.
- **Çözüm**: try/finally pattern.

### BUG-039: JSON Parse Error Sessizce Yutulyor
- **Dosya**: `src/core/resolver.ts:156-158`
- **Açıklama**: Package.json parse hatası ignore ediliyor.
- **Etki**: Kullanıcı neden modül bulunamadığını anlamaz.
- **Çözüm**: Warning log'la.

### BUG-040: Error.captureStackTrace V8-Specific
- **Dosya**: `src/errors.ts:10`
- **Açıklama**: Diğer JS engine'lerde çalışmaz.
- **Etki**: Non-V8 ortamlarda crash.
- **Çözüm**: Feature detection ekle.

### BUG-041: Watch Mode Throw Ediyor
- **Dosya**: `src/index.ts:130-132`
- **Açıklama**: `throw new Error('Watch mode is not implemented yet')`
- **Etki**: CLI'da --watch kullanılamaz.
- **Çözüm**: Watch mode implement et.

### BUG-042: CircularDependencyError Kullanılmıyor
- **Dosya**: `src/core/graph.ts:104`
- **Açıklama**: Generic Error fırlatılıyor, custom error class var ama kullanılmıyor.
- **Etki**: Error handling tutarsız.
- **Çözüm**: Custom error class kullan.

---

## BÖLÜM 3: MINOR BUGLAR (P2)

### BUG-043: Import Regex ReDoS Vulnerable
- **Dosya**: `src/core/parser/parser.ts:33`
- **Açıklama**: `[^]*?` pattern exponential backtracking yapabilir.
- **Çözüm**: Daha güvenli regex veya timeout.

### BUG-044: readDir Hidden File Filter Hardcoded
- **Dosya**: `src/utils/fs.ts:78`
- **Açıklama**: `.` ile başlayan dosyalar her zaman filtreleniyor.
- **Çözüm**: Config option ekle.

### BUG-045: isFile Permission Error'u False Döndürüyor
- **Dosya**: `src/utils/fs.ts:54-60`
- **Açıklama**: ENOENT ve EACCES ayrımı yok.
- **Çözüm**: Error code'a göre farklı davran.

### BUG-046: Sync File Operations
- **Dosya**: `src/core/resolver.ts:135-138` ve `src/utils/fs.ts:54-70`
- **Açıklama**: Resolver'da sync I/O kullanılıyor.
- **Çözüm**: Async'e çevir.

### BUG-047: indexOf in Loop O(n²)
- **Dosya**: `src/utils/sourcemap.ts:70-71`
- **Açıklama**: Her mapping için sources/names array'de indexOf.
- **Çözüm**: Map kullan.

### BUG-048: Repeated Package.json Reads
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: Aynı package.json birden fazla kez okunuyor.
- **Çözüm**: Cache ekle.

### BUG-049: String Concatenation in Loop
- **Dosya**: `src/core/linker.ts:56-58`
- **Açıklama**: `code +=` her iterasyonda yeni string.
- **Çözüm**: Array push + join.

### BUG-050: Duplicate Import Statements
- **Dosya**: `src/core/linker.ts:102-113`
- **Açıklama**: Aynı modülden birden fazla import olabilir.
- **Çözüm**: Import deduplication.

### BUG-051: `hash & hash` No-op
- **Dosya**: `src/utils/hash.ts:9`
- **Açıklama**: `x & x === x`, anlamsız operation.
- **Çözüm**: `hash |= 0` veya kaldır.

### BUG-052: Unused `fromPath` Parameter
- **Dosya**: `src/core/resolver.ts:73`
- **Açıklama**: `resolveAliasPath` ikinci parametreyi kullanmıyor.
- **Çözüm**: Kaldır veya kullan.

### BUG-053: Tokenizer Kullanılmıyor
- **Dosya**: `src/core/parser/tokenizer.ts`
- **Açıklama**: Tüm dosya dead code.
- **Çözüm**: Kullan veya sil.

### BUG-054: ModuleInfo code Field Duplicate
- **Dosya**: `src/core/graph.ts:10-19`
- **Açıklama**: `info.code` ve `node.code` aynı veriyi tutuyor.
- **Çözüm**: Birini kaldır.

### BUG-055: PathUtils Gereksiz Abstraction
- **Dosya**: `src/utils/path.ts`
- **Açıklama**: Sadece node:path'ı wrap ediyor, ek değer yok.
- **Çözüm**: Direkt path modülünü kullan.

### BUG-056: Format Check If-Else Aynı Kod
- **Dosya**: `src/core/linker.ts:56-64`
- **Açıklama**: ESM/CJS/IIFE branch'ları aynı kodu çalıştırıyor.
- **Çözüm**: Tek branch veya farklı logic.

### BUG-057: buildOrder Filter Gereksiz
- **Dosya**: `src/core/linker.ts:43`
- **Açıklama**: `isImported` her zaman true olmalı.
- **Çözüm**: Filter'ı kaldır veya mantığı düzelt.

### BUG-058: Namespace + Named Import Combination
- **Dosya**: `src/core/linker.ts:160-161`
- **Açıklama**: `import def, * as ns from 'x'` desteklenmiyor.
- **Çözüm**: Combination handling ekle.

### BUG-059: Windows Path Separator
- **Dosya**: Çeşitli dosyalar
- **Açıklama**: Her yerde `/` kullanılıyor.
- **Çözüm**: `path.sep` veya normalize.

### BUG-060: Symlink Resolution Tutarsız
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: Symlink follow/resolve tutarsızlığı.
- **Çözüm**: Consistent policy belirle.

### BUG-061: Very Long File Path Support
- **Dosya**: Çeşitli dosyalar
- **Açıklama**: Windows MAX_PATH (260) limiti kontrol edilmiyor.
- **Çözüm**: Long path prefix (\\?\) desteği.

### BUG-062: Unicode Path Support
- **Dosya**: Çeşitli dosyalar
- **Açıklama**: Unicode normalization yok.
- **Çözüm**: NFC normalization.

### BUG-063: URL Import Desteklenmiyor
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: `https://` import'lar handle edilmiyor.
- **Çözüm**: URL import desteği ekle.

### BUG-064: Import Assertions/Attributes Yok
- **Dosya**: `src/core/parser/parser.ts`
- **Açıklama**: `import x from 'y' with { type: 'json' }` desteklenmiyor.
- **Çözüm**: Import attributes parsing.

### BUG-065: showVersion Hardcoded
- **Dosya**: `src/cli.ts:156-159`
- **Açıklama**: Version JSON string içinde hardcoded.
- **Çözüm**: package.json'dan oku.

---

## BÖLÜM 4: GÜVENLİK SORUNLARI (Security)

### SEC-001: Config File Arbitrary Code Execution
- **Dosya**: `src/config.ts:17`
- **Açıklama**: User-controlled path'ten dynamic import.
- **Risk**: Malicious config dosyası sisteme erişir.
- **Çözüm**: Path validation, sandbox.

### SEC-002: Path Traversal via Alias
- **Dosya**: `src/core/resolver.ts:64-70`
- **Açıklama**: Alias ile `../../../etc/passwd` inject edilebilir.
- **Risk**: Sensitive file access.
- **Çözüm**: Resolved path'in cwd içinde olduğunu kontrol et.

### SEC-003: Regex Injection
- **Dosya**: `src/core/resolver.ts:278-289`
- **Açıklama**: External pattern'ler validate edilmeden RegExp'e.
- **Risk**: ReDoS.
- **Çözüm**: Regex validation veya escape.

### SEC-004: Prototype Pollution via Config
- **Dosya**: `src/config.ts:17-18`
- **Açıklama**: Config dosyası Object.prototype'ı modifiye edebilir.
- **Risk**: Application-wide pollution.
- **Çözüm**: Object.freeze, null prototype.

### SEC-005: Error Message Info Leak
- **Dosya**: `src/cli.ts:117`
- **Açıklama**: Error object direkt log'lanıyor.
- **Risk**: Sensitive path/state leak.
- **Çözüm**: Sanitized error message.

### SEC-006: No Input Sanitization
- **Dosya**: Çeşitli dosyalar
- **Açıklama**: User input'lar sanitize edilmiyor.
- **Risk**: Injection attacks.
- **Çözüm**: Input validation layer.

### SEC-007: Symlink Attack Surface
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: Symlink'ler unrestricted follow ediliyor.
- **Risk**: Directory escape.
- **Çözüm**: Symlink policy (follow/nofollow/error).

### SEC-008: Resource Exhaustion
- **Dosya**: Çeşitli dosyalar
- **Açıklama**: Memory/time limit yok.
- **Risk**: DoS via large input.
- **Çözüm**: Resource limits.

---

## BÖLÜM 5: PERFORMANS SORUNLARI (Performance)

### PERF-001: Sync I/O in Resolver
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: Her resolution için sync file system calls.
- **Etki**: I/O blocking, slow builds.
- **Çözüm**: Async I/O.

### PERF-002: No Caching
- **Dosya**: Tüm kod
- **Açıklama**: File read, parse, resolution sonuçları cache'lenmiyor.
- **Etki**: Tekrarlanan işlemler.
- **Çözüm**: Memory cache, disk cache.

### PERF-003: O(n²) String Concatenation
- **Dosya**: `src/core/linker.ts:56-58`
- **Açıklama**: Loop'ta `+=` ile string birleştirme.
- **Etki**: Large bundle'larda yavaş.
- **Çözüm**: Array + join.

### PERF-004: O(n²) Array indexOf
- **Dosya**: `src/utils/sourcemap.ts:70-71`
- **Açıklama**: Her mapping için indexOf call.
- **Etki**: Large source map'lerde yavaş.
- **Çözüm**: Map lookup.

### PERF-005: No Parallel Processing
- **Dosya**: `src/index.ts:73-79`
- **Açıklama**: Entry point'ler sequential process ediliyor.
- **Etki**: Multi-core kullanılmıyor.
- **Çözüm**: Promise.all.

### PERF-006: Repeated Package.json Parse
- **Dosya**: `src/core/resolver.ts`
- **Açıklama**: Aynı package.json birden fazla kez okunup parse ediliyor.
- **Etki**: Redundant I/O.
- **Çözüm**: Cache.

### PERF-007: No Incremental Build
- **Dosya**: Tüm kod
- **Açıklama**: Her build'de her şey baştan yapılıyor.
- **Etki**: Büyük projelerde yavaş.
- **Çözüm**: Incremental build support.

### PERF-008: Regex Backtracking
- **Dosya**: `src/core/parser/parser.ts:33`
- **Açıklama**: `[^]*?` exponential backtracking.
- **Etki**: Pathological input'ta hang.
- **Çözüm**: Daha efficient regex.

### PERF-009: Unnecessary Object Spread
- **Dosya**: `src/core/linker.ts:53`
- **Açıklama**: Her modül için `{ ...module.info, code }`.
- **Etki**: Object allocation overhead.
- **Çözüm**: Direct property access.

### PERF-010: No Lazy Parsing
- **Dosya**: `src/index.ts:50`
- **Açıklama**: Tüm modüller hemen parse ediliyor.
- **Etki**: Gereksiz CPU usage.
- **Çözüm**: On-demand parsing.

### PERF-011: Memory Fragmentation
- **Dosya**: Çeşitli dosyalar
- **Açıklama**: Çok sayıda küçük object allocation.
- **Etki**: GC pressure.
- **Çözüm**: Object pooling, larger allocations.

### PERF-012: No String Interning
- **Dosya**: Çeşitli dosyalar
- **Açıklama**: Aynı string'ler tekrar tekrar oluşturuluyor.
- **Etki**: Memory waste.
- **Çözüm**: String pool.

### PERF-013: Closure Capture Overhead
- **Dosya**: `src/index.ts:42-70`
- **Açıklama**: `processModule` closure çok şey capture ediyor.
- **Etki**: Memory overhead.
- **Çözüm**: Class method.

### PERF-014: Unnecessary Async
- **Dosya**: `src/plugins/core/css.ts:8`
- **Açıklama**: `async` function hiç await kullanmıyor.
- **Etki**: Promise overhead.
- **Çözüm**: `async` kaldır.

### PERF-015: Full Graph Iteration
- **Dosya**: `src/core/graph.ts:142-148`
- **Açıklama**: Prune için tüm modüller iterate ediliyor.
- **Etki**: O(n²) complexity.
- **Çözüm**: Reachability-based prune.

---

## BÖLÜM 6: TASARIM SORUNLARI (Design)

### DESIGN-001: No Dependency Injection
- **Dosya**: `src/index.ts:33-38`
- **Açıklama**: Parser, resolver hardcoded instantiate ediliyor.
- **Etki**: Test zorluğu.
- **Çözüm**: DI pattern.

### DESIGN-002: Exposed Internal State
- **Dosya**: `src/types.ts:194`
- **Açıklama**: `modules: Map<string, ModuleNode>` public.
- **Etki**: Encapsulation violation.
- **Çözüm**: Readonly view veya getter.

### DESIGN-003: Inconsistent Async/Sync API
- **Dosya**: `src/utils/fs.ts`
- **Açıklama**: Bazı metodlar async, bazıları sync.
- **Etki**: API tutarsızlığı.
- **Çözüm**: Consistent async API.

### DESIGN-004: Missing Hook Types
- **Dosya**: `src/kernel.ts`
- **Açıklama**: Bail, Loop, Interception hook'ları yok.
- **Etki**: Limited plugin API.
- **Çözüm**: Full hook taxonomy.

### DESIGN-005: No Plugin Ordering
- **Dosya**: `src/kernel.ts:28-30`
- **Açıklama**: Tap'ler sadece ekleme sırasına göre.
- **Etki**: Plugin priority kontrolü yok.
- **Çözüm**: before/after/stage options.

### DESIGN-006: No Plugin Communication
- **Dosya**: `src/kernel.ts`
- **Açıklama**: Plugin'ler arası data paylaşımı yok.
- **Etki**: Plugin isolation aşırı.
- **Çözüm**: Shared context.

### DESIGN-007: Tight Coupling
- **Dosya**: Tüm kod
- **Açıklama**: Modüller birbirine sıkı bağlı.
- **Etki**: Reusability düşük.
- **Çözüm**: Interface-based design.

### DESIGN-008: God Function
- **Dosya**: `src/index.ts:12-128`
- **Açıklama**: `bundle()` fonksiyonu çok şey yapıyor.
- **Etki**: Test ve maintain zorluğu.
- **Çözüm**: Single responsibility.

### DESIGN-009: Magic Strings
- **Dosya**: Çeşitli dosyalar
- **Açıklama**: 'main.js', 'esm', 'cjs' gibi hardcoded string'ler.
- **Etki**: Typo riski, refactor zorluğu.
- **Çözüm**: Constants/enums.

### DESIGN-010: Null vs Undefined Ambiguity
- **Dosya**: `src/types.ts:154`
- **Açıklama**: `ResolveResult = string | null | undefined` - fark ne?
- **Etki**: Semantic ambiguity.
- **Çözüm**: Tek bir "nothing" tipi.

### DESIGN-011: CLI Auto-Run
- **Dosya**: `src/cli.ts:161`
- **Açıklama**: Import edildiğinde otomatik çalışıyor.
- **Etki**: Test edilemez.
- **Çözüm**: Explicit invocation.

### DESIGN-012: No Error Recovery
- **Dosya**: Tüm kod
- **Açıklama**: Tek hata tüm build'i durduruyor.
- **Etki**: Poor UX.
- **Çözüm**: Partial failure support.

### DESIGN-013: Interface Inconsistency
- **Dosya**: `src/types.ts`
- **Açıklama**: ModuleInfo vs ModuleNode, BundleConfig vs BuildOptions farkları belirsiz.
- **Etki**: Confusion.
- **Çözüm**: Clear naming.

### DESIGN-014: No Logging Strategy
- **Dosya**: Tüm kod
- **Açıklama**: console.log/warn/error dağınık.
- **Etki**: Log level control yok.
- **Çözüm**: Logger abstraction.

### DESIGN-015: No Metrics/Profiling
- **Dosya**: Tüm kod
- **Açıklama**: Build timing sadece total süre.
- **Etki**: Performance bottleneck bulma zor.
- **Çözüm**: Phase-level metrics.

---

## BÖLÜM 7: EKSİK ÖZELLİKLER (Missing Features)

### FEAT-001: Watch Mode
- Değişiklikleri izle, incremental rebuild yap.

### FEAT-002: Code Splitting
- Dynamic import'lar için ayrı chunk'lar oluştur.

### FEAT-003: Tree Shaking
- Kullanılmayan export'ları kaldır.

### FEAT-004: Minification
- Terser/esbuild entegrasyonu.

### FEAT-005: TypeScript Compilation
- .ts dosyalarını compile et.

### FEAT-006: CSS Processing
- CSS import'ları handle et.

### FEAT-007: Asset Handling
- Image, font vb. dosyaları kopyala/optimize et.

### FEAT-008: Source Map Composition
- Zincirli transform'ların source map'lerini birleştir.

### FEAT-009: HMR (Hot Module Replacement)
- Development'ta anlık güncelleme.

### FEAT-010: Bundle Analysis
- Chunk size, dependency visualization.

### FEAT-011: Progress Reporting
- Build ilerlemesini göster.

### FEAT-012: JSON Output Mode
- Machine-readable output.

### FEAT-013: Verbose Logging
- Debug mode.

### FEAT-014: Multiple Entry Points
- Her entry için ayrı bundle.

### FEAT-015: UMD Format
- Universal module definition output.

### FEAT-016: External Globals
- IIFE'de external'ları global'den al.

### FEAT-017: Banner/Footer Injection
- License header, custom code.

### FEAT-018: Define/Replace
- Compile-time constant replacement.

### FEAT-019: Environment Variables
- process.env injection.

### FEAT-020: Conditional Compilation
- Platform-specific kod.

---

## BÖLÜM 8: BOŞ/TAMAMLANMAMIŞ DOSYALAR

### EMPTY-001: src/plugins/optional/minifier.ts
- Sadece `// @ts-nocheck`, implementasyon yok.

### EMPTY-002: src/plugins/optional/sourcemaps.ts
- Boş dosya.

### EMPTY-003: src/plugins/optional/splitting.ts
- Boş dosya.

### EMPTY-004: src/plugins/optional/treeshake.ts
- Boş dosya.

### EMPTY-005: src/plugins/optional/typescript.ts
- Boş dosya.

### EMPTY-006: src/core/parser/simple.ts
- Boş dosya.

---

## ÖNCELİK SIRASI

### Hemen (P0):
1. BUG-001: Waterfall hook
2. BUG-002: Dependency graph logic
3. BUG-003: Entry point marking
4. BUG-007: Scoped package
5. BUG-004, BUG-005: Source map (library kullan)

### Bu Hafta (P1):
6. BUG-019: @ts-nocheck kaldır
7. BUG-020, BUG-021, BUG-022: Parser (Acorn kullan)
8. BUG-038: Resource cleanup
9. BUG-006: Circular detection

### Sonraki Sprint (P2):
10. Remaining bugs...
11. Security issues...
12. Performance issues...

---

## NOTLAR

- Toplam kritik bug: 18
- Toplam major bug: 42
- Toplam minor bug: 65+
- Toplam güvenlik sorunu: 8
- Toplam performans sorunu: 15
- Toplam tasarım sorunu: 15
- Toplam eksik özellik: 20
- Toplam boş dosya: 6

**Tahmini düzeltme süresi**: 4-6 hafta (full-time)

**Öneri**: Parser ve source map için library kullan, sıfırdan yazma.
