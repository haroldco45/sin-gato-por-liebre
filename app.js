/* Sin Gato por Liebre — Vibras Positivas HM
   App ciudadana para verificar títulos, tarjetas profesionales y certificados laborales
   de candidatos y funcionarios en fuentes oficiales de Colombia. */
(function(){
'use strict';

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const TZ = 'America/Bogota';
const store = {
  get(k, d){ try{ const v = localStorage.getItem('sgpl_'+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem('sgpl_'+k, JSON.stringify(v)); }catch(e){} }
};
let LANG = store.get('lang', 'es');
const T = o => (o && typeof o === 'object') ? (o[LANG] || o.es) : o;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bogotaDay = d => new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const fmtDate = (d, opt) => new Intl.DateTimeFormat(LANG==='en'?'en-US':'es-CO', Object.assign({timeZone:TZ}, opt||{day:'numeric',month:'short',year:'numeric'})).format(d);
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('on'),2800); }

/* ---------- Fotos reales (Wikimedia Commons) ---------- */
const WM = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';
const PHOTOS = [
  'img/congreso.jpg','img/ceremonia.jpg','img/capitolio.jpg','img/graduados.jpg','img/ceremonia2.jpg','img/fachada.jpg'
];

/* ---------- Textos de la interfaz (ES / EN) ---------- */
const I18N = {
  nav_hoy:{es:'Hoy',en:'Today'}, nav_verificar:{es:'Verificar',en:'Verify'}, nav_alertas:{es:'Alertas',en:'Red flags'},
  nav_fuentes:{es:'Fuentes',en:'Sources'}, nav_ley:{es:'La ley',en:'The law'}, nav_peticion:{es:'Petición',en:'Petition'},
  btn_update:{es:'Actualizar',en:'Refresh'},
  hero_kicker:{es:'App ciudadana · Control estricto a hojas de vida públicas',en:'Citizen app · Strict checks on public officials’ résumés'},
  hero_title:{es:'¿Ese título es real?<br><span>Que no nos metan gato por liebre.</span>',en:'Is that degree real?<br><span>Don’t let them fool us.</span>'},
  hero_lead:{es:'Diplomas comprados, convalidaciones que no existen, cartas laborales inventadas. Los cargos públicos los pagamos con nuestros impuestos: antes de dar un puesto o un voto, se verifica en las fuentes oficiales.',en:'Bought diplomas, recognitions that don’t exist, made-up job letters. Our taxes pay for public posts: before giving anyone a job or a vote, check the official sources.'},
  hero_cta1:{es:'Verificar una hoja de vida',en:'Verify a résumé'}, hero_cta2:{es:'Exigir respuesta a los entes',en:'Demand answers from authorities'},
  stat1:{es:'títulos de la U. San José bajo sospecha, según la denuncia de la congresista Jennifer Pedraza (ene 2026)',en:'San José university degrees under suspicion, per Jennifer Pedraza’s complaint (Jan 2026)'},
  stat2:{es:'meses de condena a Juliana Guerrero por fraude procesal con títulos irregulares (sept 2026)',en:'months: Juliana Guerrero’s sentence for procedural fraud with irregular degrees (Sept 2026)'},
  stat3:{es:'días hábiles tiene una entidad para responder tu derecho de petición',en:'business days an agency has to answer your petition'},
  hoy_eyebrow:{es:'Se actualiza cada vez que entras',en:'Refreshes every time you open it'}, hoy_title:{es:'Hoy',en:'Today'},
  hoy_robot:{es:'Robot de noticias:',en:'News robot:'}, hoy_buscando:{es:'buscando en vivo…',en:'searching live…'},
  hoy_cnt:{es:'noticias de hoy sobre títulos y documentos falsos',en:'stories today about fake degrees and documents'},
  hoy_total:{es:'noticias reunidas por el robot y la búsqueda en vivo',en:'stories gathered by the robot and live search'},
  hoy_mis:{es:'verificaciones guardadas en este celular',en:'checks saved on this phone'},
  btn_mas:{es:'Ver más noticias',en:'More stories'},
  ver_eyebrow:{es:'Control estricto, paso a paso',en:'Strict control, step by step'}, ver_title:{es:'Verificador de hoja de vida',en:'Résumé checker'},
  ver_sub:{es:'Anota lo que la persona declara. La app te arma la ruta oficial de verificación según cada documento, marcas lo que encontraste y obtienes un semáforo y un acta para imprimir o enviar. Todo queda guardado solo en tu celular.',en:'Enter what the person claims. The app builds the official verification route for each document; you mark what you found and get a traffic light and a report to print or send. Everything stays on your phone only.'},
  mode_ciu:{es:'Soy ciudadano / votante',en:'I’m a citizen / voter'}, mode_ent:{es:'Soy entidad o partido (antes de nombrar o avalar)',en:'I’m an agency or party (before hiring or endorsing)'},
  f_nombre:{es:'Nombre de la persona',en:'Person’s name'}, f_cargo:{es:'Cargo o candidatura',en:'Post or candidacy'},
  f_entidad:{es:'Entidad, partido o corporación',en:'Agency, party or body'}, f_req:{es:'¿El cargo exige título profesional?',en:'Does the post require a degree?'},
  opt_si:{es:'Sí, es requisito del cargo o contrato',en:'Yes, it’s a requirement'}, opt_no:{es:'No es requisito (ej. Congreso), pero lo declaró',en:'Not required (e.g. Congress), but they claimed it'}, opt_nose:{es:'No sé',en:'Not sure'},
  f_docs:{es:'Documentos que presenta',en:'Documents presented'}, btn_add_doc:{es:'Agregar documento',en:'Add document'},
  btn_ruta:{es:'Armar ruta de verificación',en:'Build verification route'},
  btn_guardar:{es:'Guardar verificación',en:'Save check'}, btn_acta:{es:'Imprimir acta / PDF',en:'Print report / PDF'},
  btn_wa:{es:'Enviar resumen por WhatsApp',en:'Send summary on WhatsApp'}, btn_a_pet:{es:'Pasar al derecho de petición',en:'Go to the petition'},
  aviso_legal:{es:'Importante: un semáforo en rojo es una <b>presunta inconsistencia</b>, no una condena. Solo la entidad que expidió el documento, el Ministerio de Educación, la Procuraduría o un juez pueden declarar que un título es falso. Comparte los hechos verificados, no insultos ni acusaciones: así tu denuncia pesa y tú quedas protegido.',en:'Important: a red light is an <b>alleged inconsistency</b>, not a verdict. Only the issuing institution, the Ministry of Education, the Inspector General or a judge can declare a degree fake. Share verified facts, not insults or accusations: that makes your complaint stronger and keeps you protected.'},
  mis_title:{es:'Mis verificaciones',en:'My checks'},
  al_eyebrow:{es:'Lo que destaparon los casos de 2026',en:'What the 2026 cases exposed'}, al_title:{es:'Señales de alerta',en:'Red flags'},
  al_sub:{es:'Ninguna señal por sí sola prueba un fraude, pero cada una obliga a pedir soportes y confirmar con la fuente oficial.',en:'No single flag proves fraud, but each one calls for supporting documents and confirmation from the official source.'},
  ca_eyebrow:{es:'Para que no se repita',en:'So it never happens again'}, ca_title:{es:'Casos que marcan el camino',en:'Cases that set the course'},
  ca_sub:{es:'Hechos publicados por medios nacionales. Donde no hay fallo, se habla de presuntas irregularidades.',en:'Facts reported by national media. Where there is no ruling, they are alleged irregularities.'},
  fu_eyebrow:{es:'Gratis y en línea',en:'Free and online'}, fu_title:{es:'Dónde se comprueba cada cosa',en:'Where to check each thing'},
  fu_sub:{es:'Fuentes oficiales del Estado colombiano. Si un portal cambia de dirección, búscalo en la página principal de la entidad.',en:'Official Colombian government sources. If a portal moves, look for it on the agency’s home page.'},
  fu_buscar:{es:'Buscar: abogado, contador, convalidación, SIGEP…',en:'Search: lawyer, accountant, recognition, SIGEP…'},
  ley_eyebrow:{es:'Lo que dice la norma',en:'What the law says'}, ley_title:{es:'La ley ya castiga el gato por liebre',en:'The law already punishes this'},
  pr_eyebrow:{es:'Para jefes de talento humano, alcaldes, gobernadores y partidos',en:'For HR heads, mayors, governors and parties'},
  pr_title:{es:'Antes de dar el puesto o el aval',en:'Before giving the job or the endorsement'},
  pr_sub:{es:'Diez controles que no cuestan plata y evitan nombrar a quien no cumple. Marca cada uno: el avance queda guardado.',en:'Ten free checks that prevent hiring someone who doesn’t qualify. Tick each one: progress is saved.'},
  pe_eyebrow:{es:'Artículo 23 de la Constitución · Ley 1755 de 2015',en:'Article 23 of the Constitution · Law 1755 of 2015'},
  pe_title:{es:'Derecho de petición a todos los entes, de una sola vez',en:'One petition to every authority, all at once'},
  pe_sub:{es:'Pide que verifiquen los documentos, que te digan qué pasó y que actúen. Tienen 15 días hábiles para responder (10 si pides documentos).',en:'Ask them to verify the documents, tell you what happened and act. They have 15 business days to reply (10 if you request documents).'},
  p_nombre:{es:'Tu nombre completo',en:'Your full name'}, p_cc:{es:'Cédula',en:'ID number'}, p_ciudad:{es:'Ciudad',en:'City'},
  p_correo:{es:'Tu correo (para la respuesta)',en:'Your email (for the reply)'}, p_cel:{es:'Celular',en:'Mobile'},
  p_persona:{es:'Persona cuyos documentos se piden verificar',en:'Person whose documents should be verified'},
  p_cargo:{es:'Cargo o candidatura',en:'Post or candidacy'}, p_entidad:{es:'Entidad o partido',en:'Agency or party'},
  p_hechos:{es:'Lo que encontraste (hechos, fechas, fuente)',en:'What you found (facts, dates, source)'},
  p_correo_ent:{es:'Correo de la entidad que nombró o del partido que avaló (opcional)',en:'Email of the hiring agency or endorsing party (optional)'},
  p_dest:{es:'Entes a los que se envía',en:'Authorities it goes to'},
  btn_enviar:{es:'Enviar a todos los entes',en:'Send to all authorities'}, btn_copiar:{es:'Copiar texto',en:'Copy text'},
  btn_pet_pdf:{es:'Imprimir / PDF',en:'Print / PDF'}, btn_pet_wa:{es:'Compartir por WhatsApp',en:'Share on WhatsApp'},
  pet_nota:{es:'El botón abre tu correo con todos los entes en un solo mensaje. Las entidades que reciben por formulario web quedan enlazadas abajo: pega allí el mismo texto. Guarda el número de radicado que te devuelvan.',en:'The button opens your email with every authority in one message. Agencies that only take web forms are linked below: paste the same text there. Keep the filing number they give you.'},
  foot_txt:{es:'App ciudadana de Vibras Positivas HM. No es un sitio del Gobierno ni acusa a nadie: organiza consultas a fuentes oficiales para que la ciudadanía exija transparencia.',en:'A Vibras Positivas HM citizen app. Not a government site and it accuses no one: it organizes official-source checks so citizens can demand transparency.'},
  foot_wa:{es:'Quiero una app como esta',en:'I want an app like this'}
};
const MSG = {
  todas:{es:'Todas',en:'All'}, hoy:{es:'Hoy',en:'Today'}, univ:{es:'Universidades',en:'Universities'}, cond:{es:'Condenas',en:'Rulings'},
  cong:{es:'Congreso y candidatos',en:'Congress & candidates'}, doc:{es:'Docentes',en:'Teachers'}, ley:{es:'Ley',en:'Law'},
  nuevo:{es:'Nuevo',en:'New'}, destacada:{es:'Lo más reciente',en:'Latest'}, leer:{es:'Leer en',en:'Read on'},
  vacio:{es:'Aún no hay noticias con ese filtro. Toca Actualizar.',en:'No stories for this filter yet. Tap Refresh.'},
  vivo_ok:{es:'búsqueda en vivo lista',en:'live search done'}, vivo_off:{es:'sin conexión: mostrando lo guardado',en:'offline: showing saved stories'},
  actualizado:{es:'Actualizado',en:'Updated'}, sin_rev:{es:'Sin revisar',en:'Not checked yet'},
  verde:{es:'Todo coincide con las fuentes oficiales',en:'Everything matches official sources'},
  amarillo:{es:'Faltan respuestas: no dar el puesto todavía',en:'Answers missing: don’t hire yet'},
  rojo:{es:'Presunta inconsistencia: pedir explicación y elevar petición',en:'Alleged inconsistency: ask for explanation and file a petition'},
  pasos:{es:'pasos',en:'steps'}, ok:{es:'Coincide',en:'Matches'}, mal:{es:'No coincide',en:'Doesn’t match'}, pend:{es:'Sin respuesta',en:'No answer'},
  abrir:{es:'Abrir consulta oficial',en:'Open official lookup'}, guardado:{es:'Verificación guardada en este celular',en:'Check saved on this phone'},
  borrar:{es:'Borrar',en:'Delete'}, ver:{es:'Abrir',en:'Open'}, nada:{es:'Todavía no has guardado verificaciones.',en:'No saved checks yet.'},
  copiado:{es:'Texto copiado',en:'Text copied'}, falta_nombre:{es:'Escribe tu nombre para firmar la petición',en:'Type your name to sign the petition'},
  abriendo:{es:'Abriendo tu correo… el texto también quedó copiado',en:'Opening your email… the text was also copied'},
  doc_tipo:{es:'Tipo de documento',en:'Document type'}, doc_que:{es:'Qué dice (título, cargo, número)',en:'What it says (degree, job, number)'},
  doc_quien:{es:'Quién lo expide',en:'Issued by'}, doc_anio:{es:'Año',en:'Year'}, quitar:{es:'Quitar',en:'Remove'},
  antecedentes:{es:'Antecedentes y transparencia (siempre)',en:'Records and transparency (always)'},
  falta_doc:{es:'Agrega al menos un documento',en:'Add at least one document'}, actualizando:{es:'Actualizando noticias…',en:'Refreshing stories…'}
};

/* ---------- Fuentes oficiales ---------- */
const L = {
  snies_ies:'https://hecaa.mineducacion.gov.co/consultaspublicas/ies',
  snies_prog:'https://hecaa.mineducacion.gov.co/consultaspublicas/programas',
  conval:'https://www.mineducacion.gov.co/portal/Educacion-superior/Convalidaciones/',
  icfes:'https://www.icfes.gov.co/',
  sigep:'https://www.funcionpublica.gov.co/sigep2',
  sirna:'https://sirna.ramajudicial.gov.co/',
  jcc:'https://www.jcc.gov.co/',
  copnia:'https://www.copnia.gov.co/',
  rethus:'https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
  cpnaa:'https://www.cpnaa.gov.co/',
  rues:'https://www.rues.org.co/',
  secop:'https://www.colombiacompra.gov.co/',
  datos:'https://www.datos.gov.co/',
  proc:'https://www.procuraduria.gov.co/Pages/Generacion-de-antecedentes.aspx',
  contra:'https://www.contraloria.gov.co/web/guest/persona-natural',
  poli:'https://antecedentes.policia.gov.co:7005/WebJudicial/',
  rnmc:'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
  libreta:'https://www.libretamilitar.mil.co/',
  dafp:'https://www.funcionpublica.gov.co/',
  regis:'https://www.registraduria.gov.co/',
  cne:'https://www.cne.gov.co/',
  cuentas:'https://www.cnecuentasclaras.gov.co/',
  sena:'https://certificados.sena.edu.co/',
  apost:'https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion',
  colpen:'https://www.colpensiones.gov.co/',
  cnsc:'https://www.cnsc.gov.co/'
};
const SOURCES = [
  {cat:{es:'Educación superior',en:'Higher education'},t:{es:'SNIES · Consulta de instituciones',en:'SNIES · Institution lookup'},d:{es:'Confirma que la universidad o institución existe y está autorizada por el Ministerio de Educación.',en:'Confirms the university exists and is authorized by the Ministry of Education.'},u:L.snies_ies,k:'universidad institucion ies snies'},
  {cat:{es:'Educación superior',en:'Higher education'},t:{es:'SNIES · Consulta de programas',en:'SNIES · Program lookup'},d:{es:'Revisa que el programa tenga registro calificado y estuviera activo en la fecha del grado. Si no aparece, es la primera alerta.',en:'Check the program had a qualified registration and was active on the graduation date.'},u:L.snies_prog,k:'programa registro calificado carrera snies'},
  {cat:{es:'Títulos del exterior',en:'Foreign degrees'},t:{es:'MinEducación · Convalidaciones',en:'Ministry of Education · Degree recognition'},d:{es:'Un título extranjero exigido para un cargo debe tener resolución de convalidación. Pide el número de resolución y confírmalo.',en:'A foreign degree required for a post needs a recognition resolution. Ask for the number and confirm it.'},u:L.conval,k:'convalidacion exterior extranjero maestria doctorado'},
  {cat:{es:'Títulos del exterior',en:'Foreign degrees'},t:{es:'Cancillería · Apostilla y legalización',en:'Foreign Ministry · Apostille'},d:{es:'Verifica la apostilla de documentos expedidos para usar en o fuera de Colombia.',en:'Verify apostilles on documents.'},u:L.apost,k:'apostilla legalizacion cancilleria'},
  {cat:{es:'Pruebas de Estado',en:'State exams'},t:{es:'ICFES · Saber Pro y Saber 11',en:'ICFES · Saber Pro & Saber 11'},d:{es:'Sin Saber Pro no hay grado profesional válido. Pide el certificado de resultados con su código de verificación y mira que la fecha sea anterior al grado.',en:'No Saber Pro, no valid professional degree. Ask for the results certificate and check the date is before graduation.'},u:L.icfes,k:'icfes saber pro saber 11 prueba estado'},
  {cat:{es:'Hoja de vida pública',en:'Public résumé'},t:{es:'SIGEP · Función Pública',en:'SIGEP · Civil Service Dept.'},d:{es:'Directorio de hoja de vida de servidores y contratistas: estudios y experiencia que declararon ante el Estado.',en:'Directory of public servants’ and contractors’ résumés: declared studies and experience.'},u:L.sigep,k:'sigep hoja de vida funcion publica servidor contratista'},
  {cat:{es:'Tarjeta profesional',en:'Professional license'},t:{es:'SIRNA · Abogados (Rama Judicial)',en:'SIRNA · Lawyers'},d:{es:'Consulta si la tarjeta profesional de abogado existe, está vigente y pertenece a esa persona.',en:'Check a lawyer’s license exists, is valid and belongs to that person.'},u:L.sirna,k:'abogado tarjeta profesional derecho sirna'},
  {cat:{es:'Tarjeta profesional',en:'Professional license'},t:{es:'Junta Central de Contadores',en:'Accountants’ Board'},d:{es:'Verifica la inscripción y vigencia de contadores públicos.',en:'Verify public accountants’ registration.'},u:L.jcc,k:'contador contaduria jcc tarjeta'},
  {cat:{es:'Tarjeta profesional',en:'Professional license'},t:{es:'COPNIA · Ingenieros',en:'COPNIA · Engineers'},d:{es:'Matrícula profesional de ingenierías y profesiones afines.',en:'Engineering professional registration.'},u:L.copnia,k:'ingeniero ingenieria copnia matricula'},
  {cat:{es:'Tarjeta profesional',en:'Professional license'},t:{es:'ReTHUS · Talento humano en salud',en:'ReTHUS · Health workers'},d:{es:'Médicos, enfermeras y demás profesiones de la salud deben aparecer inscritos.',en:'Doctors, nurses and other health professionals must be registered.'},u:L.rethus,k:'medico salud enfermera rethus odontologo'},
  {cat:{es:'Tarjeta profesional',en:'Professional license'},t:{es:'CPNAA · Arquitectos',en:'CPNAA · Architects'},d:{es:'Matrícula de arquitectos y profesiones auxiliares.',en:'Architects’ registration.'},u:L.cpnaa,k:'arquitecto cpnaa'},
  {cat:{es:'Formación técnica',en:'Technical training'},t:{es:'SENA · Certificados',en:'SENA · Certificates'},d:{es:'Verifica certificados de formación del SENA.',en:'Verify SENA training certificates.'},u:L.sena,k:'sena tecnico curso certificado'},
  {cat:{es:'Experiencia laboral',en:'Work history'},t:{es:'RUES · Registro de empresas',en:'RUES · Business registry'},d:{es:'La empresa que firma la carta laboral debe existir, tener NIT y matrícula renovada. Llama al número oficial, no al del certificado.',en:'The company signing the job letter must exist and have a tax ID. Call its official number, not the one on the letter.'},u:L.rues,k:'empresa carta laboral certificado laboral rues nit camara comercio'},
  {cat:{es:'Experiencia laboral',en:'Work history'},t:{es:'SECOP · Contratos con el Estado',en:'SECOP · Public contracts'},d:{es:'Si dice que trabajó como contratista en una entidad, el contrato debe estar publicado.',en:'If they claim public contracting experience, the contract must be published.'},u:L.secop,k:'secop contrato contratista experiencia colombia compra'},
  {cat:{es:'Experiencia laboral',en:'Work history'},t:{es:'Colpensiones · Historia laboral',en:'Colpensiones · Work history'},d:{es:'La persona puede descargar su historia laboral: los aportes deben coincidir con los trabajos que declara.',en:'The person can download their contribution history: it should match the jobs claimed.'},u:L.colpen,k:'historia laboral aportes pension colpensiones'},
  {cat:{es:'Antecedentes',en:'Records'},t:{es:'Procuraduría · Antecedentes disciplinarios',en:'Inspector General · Disciplinary records'},d:{es:'Sanciones e inhabilidades vigentes.',en:'Current sanctions and disqualifications.'},u:L.proc,k:'procuraduria antecedentes disciplinarios inhabilidad'},
  {cat:{es:'Antecedentes',en:'Records'},t:{es:'Contraloría · Responsables fiscales',en:'Comptroller · Fiscal liability'},d:{es:'Si aparece en el boletín de responsables fiscales no puede posesionarse.',en:'Anyone on the fiscal liability list cannot take office.'},u:L.contra,k:'contraloria responsable fiscal boletin'},
  {cat:{es:'Antecedentes',en:'Records'},t:{es:'Policía · Antecedentes judiciales',en:'Police · Criminal records'},d:{es:'Consulta con número de cédula.',en:'Lookup by ID number.'},u:L.poli,k:'policia antecedentes judiciales'},
  {cat:{es:'Antecedentes',en:'Records'},t:{es:'Policía · Medidas correctivas',en:'Police · Corrective measures'},d:{es:'Multas del Código de Policía pendientes.',en:'Unpaid Police Code fines.'},u:L.rnmc,k:'medidas correctivas multa codigo policia rnmc'},
  {cat:{es:'Otros documentos',en:'Other documents'},t:{es:'Libreta militar',en:'Military card'},d:{es:'Verifica la situación militar definida.',en:'Verify military status.'},u:L.libreta,k:'libreta militar'},
  {cat:{es:'Candidatos',en:'Candidates'},t:{es:'Registraduría · Candidatos inscritos',en:'Registrar · Registered candidates'},d:{es:'Listas e inscripciones oficiales de cada elección.',en:'Official candidate lists.'},u:L.regis,k:'registraduria candidato inscripcion eleccion'},
  {cat:{es:'Candidatos',en:'Candidates'},t:{es:'CNE · Cuentas Claras',en:'CNE · Campaign finance'},d:{es:'Ingresos y gastos de campaña reportados por los candidatos.',en:'Campaign income and spending.'},u:L.cuentas,k:'cne cuentas claras campaña candidato'},
  {cat:{es:'Transparencia',en:'Transparency'},t:{es:'Función Pública · Bienes, rentas y conflictos (Ley 2013)',en:'Assets and conflicts of interest (Law 2013)'},d:{es:'Altos funcionarios deben publicar su declaración de bienes y conflictos de interés. Busca el aplicativo de integridad en el portal de Función Pública.',en:'Senior officials must publish assets and conflicts of interest.'},u:L.dafp,k:'ley 2013 bienes rentas conflicto interes integridad'}
];

/* ---------- Tipos de documento y su ruta de verificación ---------- */
const S = (t,d,u) => ({t,d,u});
const DOCS = {
  titulo:{n:{es:'Título universitario colombiano',en:'Colombian university degree'},steps:[
    S({es:'La institución existe y está autorizada',en:'Institution exists and is authorized'},{es:'Búscala por nombre en el SNIES.',en:'Search it by name in SNIES.'},L.snies_ies),
    S({es:'El programa tenía registro calificado en la fecha del grado',en:'Program was registered on the graduation date'},{es:'Revisa el estado del programa y sus fechas en el SNIES.',en:'Check the program status and dates in SNIES.'},L.snies_prog),
    S({es:'Presentó Saber Pro ANTES de graduarse',en:'Took Saber Pro BEFORE graduating'},{es:'Pide el certificado del ICFES con código de verificación. Sin Saber Pro, o con fecha posterior al grado, el título queda en duda (fue el patrón de los casos de 2026).',en:'Ask for the ICFES certificate. No Saber Pro, or a later date, puts the degree in doubt.'},L.icfes),
    S({es:'La universidad confirma por escrito el grado',en:'University confirms the degree in writing'},{es:'Escribe a Secretaría General o Registro Académico: número de acta, libro y folio. Pide la confirmación directa, no por intermedio de la persona.',en:'Write to the registrar: certificate, book and page number. Ask them directly.'},null),
    S({es:'Tiempos razonables de estudio',en:'Reasonable study timeline'},{es:'Varias carreras al mismo tiempo, en pocos meses o justo antes del nombramiento son señal de alerta.',en:'Several degrees at once, in a few months or right before hiring are red flags.'},null),
    S({es:'Coincide con su hoja de vida del SIGEP',en:'Matches SIGEP résumé'},{es:'Lo que muestra en campaña o en redes debe ser lo mismo que declaró ante el Estado.',en:'What they claim publicly must match what they declared to the State.'},L.sigep)
  ]},
  exterior:{n:{es:'Título del exterior (maestría, doctorado…)',en:'Foreign degree (master’s, PhD…)'},steps:[
    S({es:'Tiene resolución de convalidación del MinEducación',en:'Has a Ministry recognition resolution'},{es:'Pide número y fecha de la resolución y confírmala con el Ministerio.',en:'Ask for the resolution number and confirm with the Ministry.'},L.conval),
    S({es:'El diploma está apostillado',en:'Diploma is apostilled'},{es:'Verifica la apostilla o legalización del documento.',en:'Verify the apostille.'},L.apost),
    S({es:'La universidad extranjera existe y está reconocida en su país',en:'Foreign university exists and is accredited'},{es:'Busca el ministerio de educación del país de origen. Cuidado con "universidades" que venden títulos por internet.',en:'Check the home country’s education ministry. Beware online diploma mills.'},null),
    S({es:'Coincide con su hoja de vida del SIGEP',en:'Matches SIGEP résumé'},{es:'Mismo nombre del programa, misma fecha.',en:'Same program name and date.'},L.sigep)
  ]},
  bachiller:{n:{es:'Diploma de bachiller',en:'High school diploma'},steps:[
    S({es:'El colegio existe y certifica el grado',en:'School exists and certifies the diploma'},{es:'Pide al colegio o a la Secretaría de Educación certificación del acta de grado.',en:'Ask the school or the education department to certify it.'},null),
    S({es:'Presentó Saber 11',en:'Took Saber 11'},{es:'Pide el certificado del ICFES.',en:'Ask for the ICFES certificate.'},L.icfes),
    S({es:'Fechas coherentes con su edad y trayectoria',en:'Dates consistent with age and history'},{es:'Un diploma falso de bachiller ya llevó a la cárcel a un concejal en Colombia.',en:'A fake high school diploma has already sent a councilor to prison in Colombia.'},null)
  ]},
  abogado:{n:{es:'Tarjeta profesional de abogado',en:'Lawyer’s license'},steps:[
    S({es:'Aparece en el SIRNA con su cédula',en:'Listed in SIRNA with their ID'},{es:'Confirma número, nombre y estado vigente.',en:'Confirm number, name and status.'},L.sirna),
    S({es:'No tiene sanciones disciplinarias vigentes',en:'No current disciplinary sanctions'},{es:'Consulta también en el SIRNA y la Procuraduría.',en:'Also check SIRNA and the Inspector General.'},L.proc)
  ]},
  contador:{n:{es:'Tarjeta de contador público',en:'Public accountant license'},steps:[
    S({es:'Inscrito y vigente en la Junta Central de Contadores',en:'Registered with the Accountants’ Board'},{es:'Confirma número y nombre.',en:'Confirm number and name.'},L.jcc),
    S({es:'El título que respalda la tarjeta es válido',en:'Underlying degree is valid'},{es:'Revisa el programa en el SNIES y el Saber Pro.',en:'Check program in SNIES and Saber Pro.'},L.snies_prog)
  ]},
  ingeniero:{n:{es:'Matrícula de ingeniero',en:'Engineering registration'},steps:[
    S({es:'Matrícula vigente en el COPNIA',en:'Valid COPNIA registration'},{es:'Confirma número, nombre y profesión.',en:'Confirm number, name and profession.'},L.copnia)
  ]},
  salud:{n:{es:'Registro profesional de salud',en:'Health professional registration'},steps:[
    S({es:'Inscrito en el ReTHUS',en:'Listed in ReTHUS'},{es:'Consulta por cédula. Un falso médico o enfermero pone vidas en riesgo.',en:'Search by ID. A fake doctor puts lives at risk.'},L.rethus)
  ]},
  arquitecto:{n:{es:'Matrícula de arquitecto',en:'Architect registration'},steps:[
    S({es:'Matrícula vigente en el CPNAA',en:'Valid CPNAA registration'},{es:'Confirma número y nombre.',en:'Confirm number and name.'},L.cpnaa)
  ]},
  laboral:{n:{es:'Certificado o carta laboral',en:'Employment letter'},steps:[
    S({es:'La empresa existe en el RUES',en:'Company exists in RUES'},{es:'NIT, dirección y matrícula renovada. Una empresa "fantasma" no puede dar experiencia.',en:'Tax ID, address and renewed registration.'},L.rues),
    S({es:'Confirmaste con la empresa por su canal oficial',en:'Confirmed through the company’s official channel'},{es:'Llama o escribe al teléfono o correo del RUES o de la página oficial, nunca al que trae la carta.',en:'Use the official phone/email, never the one on the letter.'},null),
    S({es:'Quien firma tenía ese cargo',en:'Signer actually held that role'},{es:'Pregunta a la empresa quién firmó y si podía certificar.',en:'Ask who signed and whether they could certify.'},null),
    S({es:'Fechas que no se cruzan y con aportes',en:'Dates don’t overlap and match contributions'},{es:'Pide su historia laboral de pensión: los aportes deben coincidir con los periodos declarados.',en:'Ask for the pension history: contributions must match.'},L.colpen),
    S({es:'Si fue en el Estado: contrato en SECOP o registro en SIGEP',en:'If public: contract in SECOP or SIGEP record'},{es:'Experiencia pública que no aparece publicada merece explicación.',en:'Unpublished public experience needs an explanation.'},L.secop)
  ]},
  sena:{n:{es:'Certificado SENA o curso',en:'SENA or course certificate'},steps:[
    S({es:'El certificado aparece en el SENA',en:'Certificate appears in SENA'},{es:'Verifica con el número de documento.',en:'Verify with the ID number.'},L.sena)
  ]},
  libreta:{n:{es:'Libreta militar',en:'Military card'},steps:[
    S({es:'Situación militar definida y verificable',en:'Military status verified'},{es:'Consulta en el portal oficial.',en:'Check the official portal.'},L.libreta)
  ]}
};
const ALWAYS = [
  S({es:'Sin sanciones ni inhabilidades en la Procuraduría',en:'No Inspector General sanctions'},{es:'Certificado de antecedentes disciplinarios.',en:'Disciplinary record certificate.'},L.proc),
  S({es:'No aparece como responsable fiscal',en:'Not on fiscal liability list'},{es:'Boletín de la Contraloría.',en:'Comptroller list.'},L.contra),
  S({es:'Antecedentes judiciales consultados',en:'Criminal records checked'},{es:'Policía Nacional.',en:'National Police.'},L.poli),
  S({es:'Hoja de vida y bienes publicados (SIGEP y Ley 2013)',en:'Résumé and assets published (SIGEP, Law 2013)'},{es:'Lo declarado debe estar completo y con soportes.',en:'Declarations must be complete and supported.'},L.sigep)
];

/* ---------- Señales de alerta ---------- */
const ALERTS = [
  [{es:'Título sin Saber Pro',en:'Degree without Saber Pro'},{es:'O con el examen presentado después del grado. Fue la irregularidad central denunciada en la Fundación Universitaria San José.',en:'Or the exam taken after graduating — the core irregularity in the San José case.'}],
  [{es:'Varias carreras en tiempo récord',en:'Several degrees in record time'},{es:'Cuatro títulos casi al mismo tiempo, o una carrera terminada en meses.',en:'Four degrees at once, or a degree finished in months.'}],
  [{es:'Programa que no aparece en el SNIES',en:'Program missing from SNIES'},{es:'O sin registro calificado vigente en la fecha en que dice haberse graduado.',en:'Or without valid registration on the claimed date.'}],
  [{es:'Grado justo antes del nombramiento',en:'Degree right before appointment'},{es:'Sobre todo si varios funcionarios del mismo círculo se graduaron en la misma institución.',en:'Especially if several officials from the same circle used the same school.'}],
  [{es:'Título extranjero sin convalidar',en:'Unrecognized foreign degree'},{es:'Cuando el cargo lo exige, sin resolución del MinEducación no vale.',en:'When required, it’s not valid without a Ministry resolution.'}],
  [{es:'Tarjeta profesional que no aparece',en:'License not found'},{es:'O cuyo número corresponde a otra persona.',en:'Or the number belongs to someone else.'}],
  [{es:'Carta laboral de empresa fantasma',en:'Job letter from a shell company'},{es:'Sin NIT, sin matrícula en el RUES, con teléfonos celulares personales o firmada por alguien sin cargo.',en:'No tax ID or registry, personal phones, or signed by someone without authority.'}],
  [{es:'Experiencias que se cruzan',en:'Overlapping jobs'},{es:'Dos trabajos de tiempo completo a la vez, o años sin aportes a pensión.',en:'Two full-time jobs at once, or years without pension contributions.'}],
  [{es:'Hoja de vida que cambia',en:'Shifting résumé'},{es:'Lo que dice en campaña no coincide con el SIGEP, o los estudios aparecen y desaparecen.',en:'Campaign claims don’t match SIGEP, or degrees come and go.'}],
  [{es:'Documento con detalles raros',en:'Odd-looking document'},{es:'Logos pixelados, errores de ortografía, firmas idénticas escaneadas, fechas en domingo o festivo.',en:'Pixelated logos, typos, identical scanned signatures, Sunday dates.'}],
  [{es:'Se niega a que verifiquen',en:'Refuses verification'},{es:'Quien tiene un título real no tiene problema en que la universidad lo confirme.',en:'Someone with a real degree has no problem with the university confirming it.'}],
  [{es:'"Títulos por ciclos" sin soporte',en:'"Cycle degrees" without support'},{es:'Los ciclos propedéuticos son legales, pero cada ciclo debe tener registro calificado, Saber Pro y tiempos reales.',en:'Stacked programs are legal, but each needs registration, Saber Pro and real study time.'}]
];

/* ---------- Casos (hechos publicados) ---------- */
const CASES = [
  {w:{es:'19 ene 2026',en:'Jan 19, 2026'},p:0,t:{es:'Denuncian 24 contratistas con títulos presuntamente irregulares',en:'24 contractors with allegedly irregular degrees'},d:{es:'La representante Cathy Juvinao señaló a contratistas de varias entidades con títulos de la Fundación Universitaria San José sin Saber Pro o con el examen después del grado. Se habló de un costo fiscal de $1.102 millones.',en:'Rep. Cathy Juvinao flagged contractors with San José degrees lacking Saber Pro or taking it after graduating; fiscal cost reported at COP 1.102 billion.'},s:'Publimetro',u:'https://www.publimetro.co/noticias/2026/01/19/cartel-de-los-diplomas-revelan-que-mas-de-20-funcionarios-habrian-llegado-al-estado-sin-cumplir-requisitos-minimos-de-ley/'},
  {w:{es:'27 ene 2026',en:'Jan 27, 2026'},p:1,t:{es:'779 títulos bajo la lupa tras revisar 1.276 hojas de vida del SIGEP',en:'779 degrees under scrutiny after reviewing 1,276 SIGEP résumés'},d:{es:'Jennifer Pedraza cruzó la información académica que funcionarios reportaron en el SIGEP con la Fundación San José y encontró patrones repetidos de inconsistencias.',en:'Jennifer Pedraza cross-checked SIGEP academic records and found repeated inconsistency patterns.'},s:'El Colombiano',u:'https://www.elcolombiano.com/colombia/fundacion-universitaria-san-jose-779-titulos-presuntamente-irregulares-EM32941713'},
  {w:{es:'3 ago 2026',en:'Aug 3, 2026'},p:3,t:{es:'Procuraduría formula cargos a ocho docentes por títulos falsificados',en:'Inspector General charges eight teachers over forged degrees'},d:{es:'Se suma a las sanciones a docentes de colegios públicos de Bogotá que ascendieron con títulos falsos.',en:'Adds to sanctions on Bogotá public school teachers promoted with fake degrees.'},s:'Asuntos Legales',u:'https://www.asuntoslegales.com.co/actualidad/procuraduria-formulo-cargos-a-ocho-docentes-por-falsificacion-en-titulos-universitarios-4017981'},
  {w:{es:'7 sept 2026',en:'Sept 7, 2026'},p:4,t:{es:'Condenado el exsecretario general de la San José',en:'Former San José registrar convicted'},d:{es:'Aceptó su responsabilidad en la expedición irregular de los títulos a nombre de Juliana Guerrero y recibió 36 meses: primera decisión penal del caso.',en:'He admitted issuing Juliana Guerrero’s irregular degrees and got 36 months — the first criminal ruling in the case.'},s:'Asuntos Legales',u:'https://www.asuntoslegales.com.co/actualidad/exsecretario-de-san-jose-recibe-condena-por-falsedad-en-documento-publico-4476533'},
  {w:{es:'9 sept 2026',en:'Sept 9, 2026'},p:5,t:{es:'Juliana Guerrero, condenada por fraude procesal',en:'Juliana Guerrero convicted of procedural fraud'},d:{es:'En preacuerdo con la Fiscalía aceptó haber usado dos títulos irregulares (tecnóloga y contadora) para aspirar al Viceministerio de las Juventudes: tres años de prisión excarcelable, multa e inhabilidad para funciones públicas.',en:'Under a plea deal she admitted using two irregular degrees to seek the Youth Vice-Ministry: three-year suspended sentence, fine and ban from public office.'},s:'Portafolio',u:'https://www.portafolio.co/economia/gobierno/cuanto-debera-pagar-juliana-guerrero-tras-ser-condenada-e-inhabilitada-por-fraude-procesal-502249'},
  {w:{es:'13 sept 2026',en:'Sept 13, 2026'},p:2,t:{es:'Al menos 700 casos con aparentes irregularidades',en:'At least 700 cases with apparent irregularities'},d:{es:'Según la investigación de Pedraza, más de 221 funcionarios no presentan títulos válidos para el Ministerio de Educación.',en:'Per Pedraza, over 221 officials hold no degree valid for the Ministry of Education.'},s:'Noticias RCN',u:'https://www.noticiasrcn.com/colombia/irregularidades-con-los-titulos-de-700-funcionarios-dados-por-la-fundacion-san-jose-1060430'},
  {w:{es:'26 oct 2026',en:'Oct 26, 2026'},p:0,t:{es:'Primer debate a la consulta pública de títulos',en:'Public degree lookup bill passes first debate'},d:{es:'La Comisión Sexta de la Cámara aprobó el PL 019 de 2026: el SNIES tendría consulta pública nominal de títulos y de convalidaciones. Pasa a plenaria.',en:'House Committee Six approved Bill 019/2026: SNIES would offer a public, by-name degree lookup. Goes to the floor.'},s:'Cámara de Representantes',u:'https://www.camara.gov.co/primer-aval-para-facilitar-el-acceso-a-la-consulta-publica-de-titulos-academicos/'}
];

/* ---------- La ley ---------- */
const LAWS = [
  [{es:'Ley 190 de 1995 · art. 5',en:'Law 190 of 1995 · art. 5'},{es:'Revocar el nombramiento',en:'Revoke the appointment'},{es:'Si alguien fue nombrado, posesionado o contratado sin cumplir los requisitos, la entidad debe pedir la revocatoria o terminar el contrato apenas lo advierta.',en:'If someone was hired without meeting requirements, the agency must revoke or terminate as soon as it notices.'}],
  [{es:'Decreto 1083 de 2015',en:'Decree 1083 of 2015'},{es:'Verificar antes de posesionar',en:'Verify before swearing in'},{es:'Antes de la posesión, la hoja de vida y los bienes van al SIGEP con soportes, y talento humano debe verificar que el aspirante cumple los requisitos del cargo.',en:'Before taking office, résumé and assets go to SIGEP with support, and HR must verify requirements.'}],
  [{es:'Código Penal · arts. 286, 287 y 291',en:'Penal Code · arts. 286, 287, 291'},{es:'Falsedad en documento público',en:'Forgery of public documents'},{es:'Castiga a quien falsifica un documento público y a quien lo usa. Un diploma es documento público, aunque la universidad sea privada.',en:'Punishes forging and using public documents. A diploma is a public document even from a private university.'}],
  [{es:'Código Penal · art. 289',en:'Penal Code · art. 289'},{es:'Falsedad en documento privado',en:'Forgery of private documents'},{es:'Aplica a cartas y certificados laborales de empresas privadas que se usan para acreditar experiencia.',en:'Applies to private job letters used to claim experience.'}],
  [{es:'Código Penal · art. 453',en:'Penal Code · art. 453'},{es:'Fraude procesal',en:'Procedural fraud'},{es:'Inducir en error a un servidor público con medios fraudulentos para obtener un acto, como un nombramiento. Por este delito fue condenada Juliana Guerrero.',en:'Misleading an official by fraud to obtain an act such as an appointment.'}],
  [{es:'Código General Disciplinario',en:'Disciplinary Code'},{es:'Destitución e inhabilidad',en:'Dismissal and disqualification'},{es:'La Procuraduría sanciona al servidor que accede o asciende con documentos falsos, como ocurrió con docentes de Bogotá.',en:'The Inspector General sanctions officials who rise with fake documents.'}],
  [{es:'Ley 2013 de 2019',en:'Law 2013 of 2019'},{es:'Bienes y conflictos a la vista',en:'Assets and conflicts in public'},{es:'Altos funcionarios deben publicar su declaración de bienes, rentas y conflictos de interés.',en:'Senior officials must publish assets, income and conflicts of interest.'}],
  [{es:'Ley 1755 de 2015',en:'Law 1755 of 2015'},{es:'Derecho de petición',en:'Right of petition'},{es:'15 días hábiles para responder; 10 si pides documentos o información. No responder es causal disciplinaria.',en:'15 business days to reply; 10 for documents. Failing to reply is a disciplinary fault.'}],
  [{es:'PL 019 de 2026 Cámara',en:'Bill 019 of 2026'},{es:'Consulta pública de títulos',en:'Public degree lookup'},{es:'Propone que el SNIES permita consultar por nombre los títulos expedidos y las convalidaciones. Aprobado en primer debate el 26 de octubre de 2026; aún no es ley.',en:'Would let anyone look up degrees by name in SNIES. Passed first debate on Oct 26, 2026; not yet law.'}]
];

/* ---------- Protocolo para entidades y partidos ---------- */
const PROTO = [
  [{es:'Hoja de vida SIGEP completa y con soportes',en:'Complete SIGEP résumé with support'},{es:'Nada se acepta "de palabra": cada estudio y experiencia con su documento.',en:'Nothing on word alone.'}],
  [{es:'Institución y programa en el SNIES',en:'Institution and program in SNIES'},{es:'Con registro calificado vigente en la fecha del grado.',en:'Registered on the graduation date.'}],
  [{es:'Saber Pro anterior al grado',en:'Saber Pro before graduation'},{es:'Certificado ICFES con código de verificación.',en:'ICFES certificate.'}],
  [{es:'Confirmación directa de la universidad',en:'Direct university confirmation'},{es:'La entidad escribe a la institución; no se recibe la confirmación por mano del aspirante.',en:'The agency writes to the school directly.'}],
  [{es:'Convalidación y apostilla si es del exterior',en:'Recognition and apostille if foreign'},{es:'Número de resolución confirmado.',en:'Resolution number confirmed.'}],
  [{es:'Tarjeta profesional vigente',en:'Valid professional license'},{es:'En el consejo profesional que corresponda.',en:'With the relevant board.'}],
  [{es:'Cartas laborales confirmadas',en:'Job letters confirmed'},{es:'Empresa en el RUES y llamada al canal oficial; cruce con SECOP o SIGEP si fue en el Estado.',en:'RUES check and official call; SECOP/SIGEP if public.'}],
  [{es:'Antecedentes consultados el mismo día',en:'Records checked the same day'},{es:'Procuraduría, Contraloría, Policía y medidas correctivas.',en:'Inspector General, Comptroller, Police.'}],
  [{es:'Bienes y conflictos de interés declarados',en:'Assets and conflicts declared'},{es:'Ley 2013 de 2019 cuando aplica.',en:'Law 2013 when applicable.'}],
  [{es:'Acta firmada y decisión publicada',en:'Signed report, published decision'},{es:'Si después aparece una inconsistencia: revocar (Ley 190, art. 5) y denunciar.',en:'If an issue appears later: revoke and report.'}]
];

/* ---------- Destinatarios del derecho de petición ---------- */
const DEST = [
  {id:'proc',n:'Procuraduría General de la Nación',w:{es:'Vigilancia disciplinaria del servidor y de quien lo nombró',en:'Disciplinary oversight'},mail:'quejas@procuraduria.gov.co',on:true},
  {id:'fisc',n:'Fiscalía General de la Nación',w:{es:'Posible falsedad en documento y fraude procesal',en:'Possible forgery and fraud'},mail:'ges.documentalpqrs@fiscalia.gov.co',on:true},
  {id:'cgr',n:'Contraloría General de la República',w:{es:'Posible detrimento por salarios u honorarios pagados',en:'Possible loss of public funds'},mail:'cgr@contraloria.gov.co',on:true},
  {id:'men',n:'Ministerio de Educación Nacional',w:{es:'Inspección y vigilancia de la institución que expidió el título',en:'Oversight of the issuing institution'},mail:'soytransparente@mineducacion.gov.co',form:'https://www.mineducacion.gov.co/1759/w3-article-400406.html',on:true},
  {id:'dafp',n:'Departamento Administrativo de la Función Pública',w:{es:'SIGEP: veracidad de la hoja de vida registrada',en:'SIGEP record accuracy'},form:'https://www.funcionpublica.gov.co/es/ciudadano',on:true},
  {id:'cnsc',n:'Comisión Nacional del Servicio Civil',w:{es:'Si el cargo es de carrera o hubo concurso',en:'If it’s a merit-based post'},form:L.cnsc,on:false},
  {id:'cne',n:'Consejo Nacional Electoral',w:{es:'Si es candidato: información falsa en la inscripción',en:'If a candidate'},form:L.cne,on:false},
  {id:'ent',n:{es:'Entidad que nombró / partido que avaló',en:'Hiring agency / endorsing party'},w:{es:'Debe verificar y, si no cumple, revocar o retirar el aval',en:'Must verify and revoke if needed'},mail:'',on:true}
];

/* ---------- i18n ---------- */
function applyLang(){
  document.documentElement.lang = LANG;
  $$('[data-i18n]').forEach(el => { const k = el.dataset.i18n; if (I18N[k]) el.innerHTML = T(I18N[k]); });
  $$('[data-i18n-html]').forEach(el => { const k = el.dataset.i18nHtml; if (I18N[k]) el.innerHTML = T(I18N[k]); });
  $$('[data-i18n-ph]').forEach(el => { const k = el.dataset.i18nPh; if (I18N[k]) el.placeholder = T(I18N[k]); });
  $('#btnLang').textContent = LANG === 'es' ? 'EN' : 'ES';
  renderAll();
}

/* ---------- Hero ---------- */
function hero(){
  const box = $('#heroSlides');
  box.innerHTML = PHOTOS.map((p,i)=>`<div class="slide${i===0?' on':''}" style="background-image:url('${p}')"></div>`).join('');
  let i = 0; const sl = $$('.slide');
  setInterval(()=>{ sl[i].classList.remove('on'); i=(i+1)%sl.length; sl[i].classList.add('on'); }, 6500);
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const el = e.target; io.unobserve(el);
    const to = +el.dataset.to; const t0 = performance.now();
    const step = t => { const k = Math.min(1,(t-t0)/1600); el.textContent = Math.round(to*(1-Math.pow(1-k,3))).toLocaleString('es-CO'); if (k<1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }));
  $$('.count').forEach(c => io.observe(c));
}

/* ---------- Noticias ---------- */
let NEWS = []; let FILTER = 'todas'; let SHOW = 9; let ROBOT_AT = null;
const QUERIES = ['títulos falsos funcionarios','diploma falso cargo público','hoja de vida falsa funcionario','falsedad documento título universitario Colombia','Fundación San José títulos','certificado laboral falso contratista','consulta pública de títulos SNIES'];
const FILTERS = {
  univ:/universidad|fundaci[oó]n|snies|saber pro|instituci[oó]n|ministerio de educaci/i,
  cond:/conden|imput|captur|c[aá]rcel|sanci|fiscal[ií]a|preacuerdo|cargos/i,
  cong:/congres|senad|c[aá]mara|candidat|concejal|alcald|gobernad|diputad|elecci/i,
  doc:/docente|profesor|maestro|colegio/i,
  ley:/proyecto de ley|\bley\b|debate|decreto|norma/i
};
function normItem(it){
  const d = new Date(it.date || it.pubDate || Date.now());
  return {title:String(it.title||'').replace(/\s+-\s+[^-]+$/,'').trim(), source:it.source||'', link:it.link||'#', date:isNaN(d)?new Date():d, img:it.img||''};
}
function mergeNews(list){
  const seen = new Map(NEWS.map(n => [n.title.toLowerCase().slice(0,70), n]));
  list.map(normItem).forEach(n => { if (!n.title) return; const k = n.title.toLowerCase().slice(0,70); if (!seen.has(k)) seen.set(k, n); });
  NEWS = Array.from(seen.values()).filter(n => /t[ií]tul|diplom|hoja de vida|certificad|falsed|falsific|saber pro|convalid|tarjeta profesional|san jos[eé]|guerrero/i.test(n.title)).sort((a,b)=>b.date-a.date).slice(0,150);
  store.set('news', NEWS.map(n => Object.assign({}, n, {date:n.date.toISOString()})));
}
async function loadRobot(){
  try{
    const r = await fetch('data/noticias.json?t='+Date.now(), {cache:'no-store'});
    const j = await r.json();
    ROBOT_AT = j.actualizado ? new Date(j.actualizado) : null;
    mergeNews(j.noticias || []);
  }catch(e){ const c = store.get('news', []); mergeNews(c); }
}
function parseRSS(xml, q){
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return Array.from(doc.querySelectorAll('item')).map(it => ({
    title: it.querySelector('title')?.textContent || '',
    link: it.querySelector('link')?.textContent || '#',
    date: it.querySelector('pubDate')?.textContent || '',
    source: it.querySelector('source')?.textContent || 'Google Noticias'
  }));
}
async function fetchVia(url){
  const proxies = [
    u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
    u => 'https://corsproxy.io/?url=' + encodeURIComponent(u)
  ];
  for (const p of proxies){
    try{
      const ctl = new AbortController(); const to = setTimeout(()=>ctl.abort(), 9000);
      const r = await fetch(p(url), {signal:ctl.signal}); clearTimeout(to);
      if (r.ok){ const t = await r.text(); if (t.includes('<item')) return t; }
    }catch(e){}
  }
  return null;
}
async function liveSearch(){
  $('#liveState').textContent = T(I18N.hoy_buscando);
  const qs = QUERIES.slice().sort(()=>Math.random()-.5).slice(0,3);
  let got = 0;
  await Promise.all(qs.map(async q => {
    const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:30d') + '&hl=es-419&gl=CO&ceid=CO:es-419';
    const xml = await fetchVia(url);
    if (xml){ const items = parseRSS(xml, q); got += items.length; mergeNews(items); }
  }));
  $('#liveState').textContent = got ? T(MSG.vivo_ok) : T(MSG.vivo_off);
  renderNews();
}
function newsImg(n, i){ return n.img || PHOTOS[i % PHOTOS.length]; }
function renderNews(){
  const today = bogotaDay(new Date());
  const isToday = n => bogotaDay(n.date) === today;
  const hoyList = NEWS.filter(isToday);
  $('#cntHoy').textContent = hoyList.length;
  $('#cntTotal').textContent = NEWS.length;
  $('#cntMis').textContent = store.get('checks', []).length;
  $('#hoyFecha').textContent = fmtDate(new Date(), {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  $('#robotHora').textContent = ROBOT_AT ? fmtDate(ROBOT_AT, {day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}) : '—';

  const top = NEWS[0];
  const big = $('#hoyDestacada');
  if (top){
    big.style.backgroundImage = `url('${newsImg(top,0)}')`;
    big.innerHTML = `<div class="in"><span class="tag">${isToday(top)?T(MSG.hoy):T(MSG.destacada)}</span><a href="${esc(top.link)}" target="_blank" rel="noopener"><h3>${esc(top.title)}</h3></a><p>${esc(top.source)} · ${fmtDate(top.date)}</p></div>`;
  } else {
    big.style.backgroundImage = `url('${PHOTOS[0]}')`;
    big.innerHTML = `<div class="in"><span class="tag">${T(MSG.destacada)}</span><h3>${T(I18N.hero_cta1)}</h3></div>`;
  }

  const f = $('#filtros');
  f.innerHTML = ['todas','hoy','univ','cond','cong','doc','ley'].map(k => `<button type="button" class="chip${FILTER===k?' on':''}" data-f="${k}">${T(MSG[k])}</button>`).join('');
  f.querySelectorAll('.chip').forEach(b => b.onclick = () => { FILTER = b.dataset.f; SHOW = 9; renderNews(); });

  let list = NEWS.slice(1);
  if (FILTER === 'hoy') list = NEWS.filter(isToday);
  else if (FILTERS[FILTER]) list = NEWS.filter(n => FILTERS[FILTER].test(n.title));
  const g = $('#noticias');
  if (!list.length){ g.innerHTML = `<div class="empty">${T(MSG.vacio)}</div>`; $('#btnMas').hidden = true; }
  else {
    g.innerHTML = list.slice(0,SHOW).map((n,i) => `<a class="news reveal" href="${esc(n.link)}" target="_blank" rel="noopener">
      <div class="ph" style="background-image:url('${newsImg(n,i+1)}')"><span class="src">${esc(n.source)}</span>${isToday(n)?`<span class="nuevo">${T(MSG.nuevo)}</span>`:''}</div>
      <div class="bd"><h4>${esc(n.title)}</h4><time>${fmtDate(n.date)}</time></div></a>`).join('');
    $('#btnMas').hidden = list.length <= SHOW;
  }
  const tk = NEWS.slice(0,12).map(n => `<a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a>`).join('');
  $('#ticker').innerHTML = tk + tk;
  observeReveal();
}

/* ---------- Verificador ---------- */
let MODE = 'ciudadano'; let CURRENT = null;
function docRow(d){
  d = d || {tipo:'titulo', que:'', quien:'', anio:''};
  const div = document.createElement('div'); div.className = 'doc';
  div.innerHTML = `<div class="field"><label>${T(MSG.doc_tipo)}</label><select class="dTipo">${Object.entries(DOCS).map(([k,v])=>`<option value="${k}"${k===d.tipo?' selected':''}>${T(v.n)}</option>`).join('')}</select></div>
    <div class="field"><label>${T(MSG.doc_que)}</label><input class="dQue" value="${esc(d.que)}"></div>
    <div class="field"><label>${T(MSG.doc_quien)}</label><input class="dQuien" value="${esc(d.quien)}"></div>
    <div class="field"><label>${T(MSG.doc_anio)}</label><input class="dAnio" inputmode="numeric" value="${esc(d.anio)}"></div>
    <button type="button" class="x">${T(MSG.quitar)}</button>`;
  div.querySelector('.x').onclick = () => div.remove();
  $('#docsList').appendChild(div);
}
function readForm(){
  return {
    id: CURRENT?.id || Date.now(), modo: MODE,
    nombre: $('#fNombre').value.trim(), cargo: $('#fCargo').value.trim(), entidad: $('#fEntidad').value.trim(), requisito: $('#fRequisito').value,
    docs: $$('#docsList .doc').map(r => ({tipo:r.querySelector('.dTipo').value, que:r.querySelector('.dQue').value.trim(), quien:r.querySelector('.dQuien').value.trim(), anio:r.querySelector('.dAnio').value.trim()})),
    res: CURRENT?.res || {}, fecha: new Date().toISOString()
  };
}
function buildRoute(c){
  const groups = c.docs.map((d,i) => ({key:'d'+i, titulo:`${T(DOCS[d.tipo].n)}${d.que?': '+d.que:''}${d.quien?' — '+d.quien:''}${d.anio?' ('+d.anio+')':''}`, steps:DOCS[d.tipo].steps}));
  groups.push({key:'a', titulo:T(MSG.antecedentes), steps:ALWAYS});
  return groups;
}
function renderRoute(){
  const c = CURRENT; if (!c) return;
  $('#ruta').hidden = false;
  const groups = buildRoute(c);
  $('#rutaPasos').innerHTML = groups.map(g => `<div class="paso-doc"><h4>${esc(g.titulo)}</h4>${g.steps.map((s,j) => {
    const id = g.key+'_'+j; const v = c.res[id] || '';
    return `<div class="paso ${v}" data-id="${id}"><div><b>${T(s.t)}</b><p>${T(s.d)}</p>${s.u?`<a class="lnk" href="${s.u}" target="_blank" rel="noopener">${T(MSG.abrir)}</a>`:''}</div>
      <div class="res">${['ok','mal','pend'].map(k=>`<button type="button" data-v="${k}" class="${v===k?'on':''}">${T(MSG[k])}</button>`).join('')}</div></div>`;
  }).join('')}</div>`).join('');
  $$('#rutaPasos .paso').forEach(p => p.querySelectorAll('button').forEach(b => b.onclick = () => {
    const id = p.dataset.id; c.res[id] = (c.res[id] === b.dataset.v) ? '' : b.dataset.v; renderRoute();
  }));
  semaforo();
}
function totals(c){
  const groups = buildRoute(c); let total = 0; const r = {ok:0,mal:0,pend:0};
  groups.forEach(g => g.steps.forEach((s,j) => { total++; const v = c.res[g.key+'_'+j]; if (r[v] !== undefined) r[v]++; }));
  return Object.assign(r, {total});
}
function colorOf(c){
  const t = totals(c);
  if (t.mal > 0) return 'rojo';
  if (t.ok === t.total && t.total) return 'verde';
  if (t.ok + t.pend > 0) return 'amarillo';
  return '';
}
function semaforo(){
  const c = CURRENT; const t = totals(c); const col = colorOf(c);
  const s = $('#semaforo'); s.className = 'semaforo ' + col;
  $('#semTitulo').textContent = col ? T(MSG[col]) : T(MSG.sin_rev);
  $('#semDetalle').textContent = `${t.ok} ${T(MSG.ok).toLowerCase()} · ${t.mal} ${T(MSG.mal).toLowerCase()} · ${t.pend} ${T(MSG.pend).toLowerCase()} · ${t.total} ${T(MSG.pasos)}`;
}
function saveCheck(){
  if (!CURRENT) return;
  const all = store.get('checks', []).filter(x => x.id !== CURRENT.id);
  all.unshift(CURRENT); store.set('checks', all.slice(0,50));
  toast(T(MSG.guardado)); renderMis(); renderNews();
}
function renderMis(){
  const all = store.get('checks', []);
  const box = $('#misList');
  if (!all.length){ box.innerHTML = `<p class="aviso">${T(MSG.nada)}</p>`; return; }
  const colors = {rojo:'var(--red)',amarillo:'var(--amber)',verde:'var(--green)','':'#ccd'};
  box.innerHTML = all.map(c => `<div class="mis-item"><span class="dot" style="background:${colors[colorOf(c)]}"></span><div class="meta"><b>${esc(c.nombre)}</b><br><small>${esc(c.cargo)} ${c.entidad?'· '+esc(c.entidad):''} · ${fmtDate(new Date(c.fecha))}</small></div>
    <button type="button" data-a="ver" data-id="${c.id}">${T(MSG.ver)}</button><button type="button" data-a="del" data-id="${c.id}">${T(MSG.borrar)}</button></div>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => {
    const id = +b.dataset.id; let list = store.get('checks', []);
    if (b.dataset.a === 'del'){ store.set('checks', list.filter(x => x.id !== id)); renderMis(); renderNews(); return; }
    const c = list.find(x => x.id === id); if (!c) return; loadCheck(c);
    $('#ruta').scrollIntoView({behavior:'smooth'});
  });
}
function loadCheck(c){
  CURRENT = c; MODE = c.modo || 'ciudadano';
  $$('.mode').forEach(m => m.classList.toggle('on', m.dataset.mode === MODE));
  $('#fNombre').value = c.nombre; $('#fCargo').value = c.cargo; $('#fEntidad').value = c.entidad; $('#fRequisito').value = c.requisito;
  $('#docsList').innerHTML = ''; c.docs.forEach(docRow); renderRoute();
}
function resumenTexto(c){
  const t = totals(c); const col = colorOf(c);
  const lines = [];
  buildRoute(c).forEach(g => g.steps.forEach((s,j) => { const v = c.res[g.key+'_'+j]; if (v) lines.push(`- ${T(s.t)}: ${T(MSG[v])}`); }));
  return `${LANG==='en'?'Verification':'Verificación'} — ${c.nombre}${c.cargo?' ('+c.cargo+')':''}${c.entidad?', '+c.entidad:''}\n${col?T(MSG[col]):T(MSG.sin_rev)} · ${t.ok}/${t.total}\n${lines.join('\n')}\n\nSin Gato por Liebre · https://sin-gato-por-liebre.netlify.app/`;
}
function printActa(c){
  const t = totals(c); const col = colorOf(c);
  const rows = []; buildRoute(c).forEach(g => g.steps.forEach((s,j) => rows.push(`<tr><td>${esc(g.titulo)}</td><td>${T(s.t)}</td><td>${s.u?esc(s.u):'—'}</td><td>${c.res[g.key+'_'+j]?T(MSG[c.res[g.key+'_'+j]]):'—'}</td></tr>`)));
  const ent = c.modo === 'entidad';
  $('#acta').innerHTML = `<h1>${ent?'Acta de verificación previa de requisitos':'Informe ciudadano de verificación'}</h1>
    <p><b>Persona:</b> ${esc(c.nombre)} &nbsp; <b>Cargo/candidatura:</b> ${esc(c.cargo)} &nbsp; <b>Entidad/partido:</b> ${esc(c.entidad)}</p>
    <p><b>Fecha:</b> ${fmtDate(new Date(), {day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit'})} (hora de Colombia) &nbsp; <b>Resultado:</b> ${col?T(MSG[col]):T(MSG.sin_rev)} (${t.ok} de ${t.total} pasos coinciden; ${t.mal} no coinciden; ${t.pend} sin respuesta)</p>
    <table><tr><th>Documento</th><th>Verificación</th><th>Fuente oficial</th><th>Resultado</th></tr>${rows.join('')}</table>
    <p style="font-size:10pt">Este documento registra consultas a fuentes oficiales. Un resultado "No coincide" es una presunta inconsistencia que debe aclararse con la entidad que expidió el documento; no constituye declaración de falsedad.${ent?' Fundamento: Decreto 1083 de 2015 (verificación de requisitos) y Ley 190 de 1995, art. 5.':''}</p>
    <div class="firma"><div>${ent?'Jefe de Talento Humano / responsable':'Ciudadano que verificó'}</div><div>${ent?'Representante legal / director del partido':'Testigo'}</div></div>
    <p style="font-size:9pt;margin-top:20pt">Generado con Sin Gato por Liebre — Vibras Positivas HM</p>`;
  document.body.classList.add('print-acta'); window.print();
  setTimeout(()=>document.body.classList.remove('print-acta'), 800);
}
function verificador(){
  $$('.mode').forEach(m => m.onclick = () => { MODE = m.dataset.mode; $$('.mode').forEach(x => x.classList.toggle('on', x===m)); if (CURRENT){ CURRENT.modo = MODE; } });
  $('#btnAddDoc').onclick = () => docRow();
  $('#verForm').onsubmit = e => {
    e.preventDefault();
    const c = readForm(); if (!c.docs.length){ toast(T(MSG.falta_doc)); return; }
    const prev = CURRENT; CURRENT = c;
    if (prev && prev.docs && JSON.stringify(prev.docs.map(d=>d.tipo)) !== JSON.stringify(c.docs.map(d=>d.tipo))) CURRENT.res = {};
    renderRoute(); $('#ruta').scrollIntoView({behavior:'smooth'});
  };
  $('#btnGuardar').onclick = saveCheck;
  $('#btnActa').onclick = () => CURRENT && printActa(CURRENT);
  $('#btnWa').onclick = () => CURRENT && window.open('https://wa.me/?text=' + encodeURIComponent(resumenTexto(CURRENT)), '_blank');
  $('#btnAPeticion').onclick = () => {
    if (!CURRENT) return;
    $('#pPersona').value = CURRENT.nombre; $('#pCargo').value = CURRENT.cargo; $('#pEntidad').value = CURRENT.entidad;
    const malos = []; buildRoute(CURRENT).forEach(g => g.steps.forEach((s,j) => { const v = CURRENT.res[g.key+'_'+j]; if (v==='mal'||v==='pend') malos.push(`${g.titulo}: ${T(s.t)} — ${T(MSG[v])}.`); }));
    if (malos.length) $('#pHechos').value = malos.join('\n');
    renderPeticion(); $('#peticion').scrollIntoView({behavior:'smooth'});
  };
  if (!$$('#docsList .doc').length){ docRow({tipo:'titulo',que:'',quien:'',anio:''}); docRow({tipo:'laboral',que:'',quien:'',anio:''}); }
}

/* ---------- Secciones estáticas ---------- */
function renderStatic(){
  $('#alertGrid').innerHTML = ALERTS.map((a,i) => `<div class="alert reveal"><span class="n">${String(i+1).padStart(2,'0')}</span><h3>${T(a[0])}</h3><p>${T(a[1])}</p></div>`).join('');
  $('#timeline').innerHTML = CASES.map(c => `<div class="tl reveal"><div class="when">${T(c.w)}</div><div class="card"><div class="ph" style="background-image:url('${PHOTOS[c.p]}')"></div><div class="bd"><h3>${T(c.t)}</h3><p>${T(c.d)}</p><a href="${c.u}" target="_blank" rel="noopener">${T(MSG.leer)} ${esc(c.s)}</a></div></div></div>`).join('');
  $('#lawGrid').innerHTML = LAWS.map(l => `<div class="law reveal"><span class="num">${T(l[0])}</span><h3>${T(l[1])}</h3><p>${T(l[2])}</p></div>`).join('');
  renderSources();
  const done = store.get('proto', []);
  $('#protoList').innerHTML = PROTO.map((p,i) => `<li class="${done.includes(i)?'done':''}" data-i="${i}"><div><b>${T(p[0])}</b><span>${T(p[1])}</span></div></li>`).join('');
  $$('#protoList li').forEach(li => li.onclick = () => {
    let d = store.get('proto', []); const i = +li.dataset.i;
    d = d.includes(i) ? d.filter(x=>x!==i) : d.concat(i); store.set('proto', d); li.classList.toggle('done'); protoBar();
  });
  protoBar();
}
function protoBar(){ const n = store.get('proto', []).length; const p = Math.round(n/PROTO.length*100); $('#protoFill').style.width = p+'%'; $('#protoPct').textContent = p+' %'; }
function renderSources(){
  const q = ($('#fuenteBuscar').value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const list = SOURCES.filter(s => !q || (s.k + ' ' + T(s.t) + ' ' + T(s.d)).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').includes(q));
  $('#srcGrid').innerHTML = list.map(s => `<div class="src reveal in"><span class="cat">${T(s.cat)}</span><h3>${T(s.t)}</h3><p>${T(s.d)}</p><a href="${s.u}" target="_blank" rel="noopener">${T(MSG.abrir)}</a></div>`).join('');
}

/* ---------- Derecho de petición ---------- */
function destName(d){ return typeof d.n === 'object' ? T(d.n) : d.n; }
function renderDest(){
  const sel = store.get('dest', null);
  $('#destList').innerHTML = DEST.map(d => {
    const on = sel ? sel.includes(d.id) : d.on;
    return `<label><input type="checkbox" value="${d.id}" ${on?'checked':''}><span><b>${esc(destName(d))}</b><small>${T(d.w)}${d.mail?' · '+d.mail:''}${!d.mail&&d.form?' · formulario web':''}</small></span></label>`;
  }).join('');
  $$('#destList input').forEach(i => i.onchange = () => { store.set('dest', $$('#destList input:checked').map(x=>x.value)); renderPeticion(); });
}
function petText(){
  const v = id => ($(id).value || '').trim();
  const hoy = fmtDate(new Date(), {day:'numeric', month:'long', year:'numeric'});
  const sel = $$('#destList input:checked').map(x => DEST.find(d => d.id === x.value));
  const ent = v('#pEntidad');
  const persona = v('#pPersona') || '[nombre de la persona]';
  const cargo = v('#pCargo') || '[cargo o candidatura]';
  return `${v('#pCiudad') || 'Caucasia, Antioquia'}, ${hoy}

Señores
${sel.map(d => d.id==='ent' ? (ent || 'Entidad que nombró / partido que avaló') : destName(d)).join('\n')}
E. S. D.

Asunto: Derecho de petición — verificación de títulos y documentos de ${persona}, ${cargo}${ent?' ('+ent+')':''}

Yo, ${v('#pNombre') || '[tu nombre]'}, identificado(a) con cédula ${v('#pCedula') || '[número]'}, en ejercicio del derecho fundamental de petición (artículo 23 de la Constitución Política y Ley 1755 de 2015), y como ciudadano(a) contribuyente cuyos impuestos pagan los cargos públicos, respetuosamente solicito:

HECHOS
1. ${persona} ocupa o aspira al cargo de ${cargo}${ent?' en/por '+ent:''}.
2. Al consultar fuentes oficiales encontré lo siguiente:
${(v('#pHechos') || '[describe lo que encontraste, con fechas y la fuente consultada]').split('\n').map(l=>'   '+l).join('\n')}
3. Estos hallazgos son, por ahora, presuntas inconsistencias que deben ser aclaradas por las autoridades competentes. No afirmo la falsedad de ningún documento; pido que se verifique.

PETICIONES
1. Que, dentro de sus competencias, se verifique la autenticidad y validez de los títulos académicos, tarjetas profesionales, convalidaciones y certificaciones laborales con los que ${persona} acreditó requisitos para el cargo, el contrato o la candidatura.
2. Que se me informe qué verificación se hizo antes del nombramiento, la posesión, el contrato o el aval, y con qué fuentes (SNIES, ICFES, convalidación, consejos profesionales, confirmación directa de la institución).
3. Que se me entregue copia de la hoja de vida y de los soportes académicos y laborales presentados, en lo que sea información pública (Ley 1712 de 2014), protegiendo los datos sensibles.
4. Que, si se confirma que no se cumplían los requisitos, se adelanten las actuaciones correspondientes: revocatoria del nombramiento o terminación del contrato (Ley 190 de 1995, art. 5), investigación disciplinaria, penal por posible falsedad en documento o fraude procesal, y fiscal por los recursos públicos pagados; y, si es candidato, las actuaciones ante la autoridad electoral y el partido que lo avaló.
5. Que se me informe el número de radicado y el estado del trámite.

Solicito respuesta de fondo dentro de los términos de la Ley 1755 de 2015 (15 días hábiles; 10 días para documentos e información). Si alguna entidad no es competente, solicito dar traslado a la que sí lo sea, informándome de ello (art. 21).

NOTIFICACIONES
Correo: ${v('#pCorreo') || '[tu correo]'}
Celular: ${v('#pCel') || '[tu celular]'}

Atentamente,

${v('#pNombre') || '[tu nombre]'}
C.C. ${v('#pCedula') || '[número]'}`;
}
function renderPeticion(){
  $('#petTexto').textContent = petText();
  const sel = $$('#destList input:checked').map(x => DEST.find(d => d.id === x.value));
  $('#formsWeb').innerHTML = sel.filter(d => d.form).map(d => `<a href="${d.form}" target="_blank" rel="noopener"><b>${esc(destName(d))}</b> — ${LANG==='en'?'web form':'formulario web para radicar'}</a>`).join('');
}
async function copyText(t){
  try{ await navigator.clipboard.writeText(t); return true; }
  catch(e){ const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(_){} ta.remove(); return true; }
}
function peticion(){
  renderDest();
  ['#pNombre','#pCedula','#pCiudad','#pCorreo','#pCel'].forEach(id => { const k='p'+id; const sv = store.get(k, null); if (sv) $(id).value = sv; $(id).addEventListener('change', () => store.set(k, $(id).value)); });
  $('#petForm').addEventListener('input', renderPeticion);
  $('#btnCopiar').onclick = async () => { await copyText(petText()); toast(T(MSG.copiado)); };
  $('#btnEnviar').onclick = async () => {
    if (!$('#pNombre').value.trim()){ toast(T(MSG.falta_nombre)); $('#pNombre').focus(); return; }
    const t = petText(); await copyText(t);
    const sel = $$('#destList input:checked').map(x => DEST.find(d => d.id === x.value));
    const mails = sel.map(d => d.id === 'ent' ? $('#pCorreoEntidad').value.trim() : d.mail).filter(Boolean);
    const cc = $('#pCorreo').value.trim();
    const subject = `Derecho de petición — verificación de títulos de ${$('#pPersona').value.trim() || 'servidor público'}`;
    let href = `mailto:${mails.join(',')}?subject=${encodeURIComponent(subject)}${cc?'&cc='+encodeURIComponent(cc):''}&body=${encodeURIComponent(t)}`;
    if (href.length > 7500) href = `mailto:${mails.join(',')}?subject=${encodeURIComponent(subject)}${cc?'&cc='+encodeURIComponent(cc):''}&body=${encodeURIComponent('(Pega aquí el texto del derecho de petición: ya quedó copiado)')}`;
    toast(T(MSG.abriendo)); window.location.href = href;
  };
  $('#btnPetPdf').onclick = () => { $('#acta').textContent = petText(); document.body.classList.add('print-pet'); window.print(); setTimeout(()=>document.body.classList.remove('print-pet'), 800); };
  $('#btnPetWa').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent((LANG==='en'?'I filed a petition to verify the degrees of ':'Radiqué un derecho de petición para que verifiquen los títulos de ') + ($('#pPersona').value.trim() || '') + '. Hazlo tú también: https://sin-gato-por-liebre.netlify.app/#peticion'), '_blank');
  renderPeticion();
}

/* ---------- Animaciones al hacer scroll ---------- */
let RIO;
function observeReveal(){
  if (!RIO) RIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); RIO.unobserve(e.target); } }), {threshold:.12});
  $$('.reveal:not(.in)').forEach(el => RIO.observe(el));
}

function renderAll(){
  renderStatic(); renderNews(); renderMis(); renderDest(); renderPeticion();
  $$('#docsList .doc').forEach(r => { const d = {tipo:r.querySelector('.dTipo').value,que:r.querySelector('.dQue').value,quien:r.querySelector('.dQuien').value,anio:r.querySelector('.dAnio').value}; r.remove(); docRow(d); });
  if (CURRENT) renderRoute();
  observeReveal();
}

/* ---------- Arranque ---------- */
async function refresh(){
  const b = $('#btnUpdate'); b.classList.add('spin'); toast(T(MSG.actualizando));
  await loadRobot(); renderNews(); await liveSearch();
  b.classList.remove('spin'); toast(T(MSG.actualizado));
}
document.addEventListener('DOMContentLoaded', async () => {
  hero(); verificador(); peticion();
  $('#btnLang').onclick = () => { LANG = LANG === 'es' ? 'en' : 'es'; store.set('lang', LANG); applyLang(); };
  $('#btnUpdate').onclick = refresh;
  $('#btnMas').onclick = () => { SHOW += 9; renderNews(); };
  $('#fuenteBuscar').oninput = renderSources;
  applyLang();
  mergeNews(store.get('news', []));
  renderNews();
  await loadRobot(); renderNews();
  liveSearch();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
});
})();
