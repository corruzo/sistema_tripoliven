import React, { useState } from 'react';
import { Scale, FileText, ShieldAlert, ExternalLink, Copyright, Info, Landmark } from 'lucide-react';

const Legal = () => {
  const [activeTab, setActiveTab] = useState('framework');

  const links = [
    {
      title: 'Ley sobre Mensajes de Datos y Firmas Electrónicas',
      desc: 'Validez legal de despachos digitales, logs de auditoría y facturación electrónica.',
      url: 'http://www.conatel.gob.ve/wp-content/uploads/2014/10/Ley-sobre-Mensajes-de-Datos-y-Firmas-Electr%C3%B3nicas.pdf'
    },
    {
      title: 'Ley Especial contra los Delitos Informáticos',
      desc: 'Protección penal contra accesos no autorizados, sabotaje o robo de información.',
      url: 'http://www.conatel.gob.ve/wp-content/uploads/2014/10/Ley-Especial-Contra-los-Delitos-Inform%C3%A1ticos.pdf'
    },
    {
      title: 'Ley sobre el Derecho de Autor (Venezuela)',
      desc: 'Marco de amparo legal para la propiedad intelectual del código fuente y el software.',
      url: 'https://wipolex-res.wipo.int/legislation/files/Venezuela-DerechoAutor-1993-es.pdf'
    },
    {
      title: 'Servicio Autónomo de Propiedad Intelectual (SAPI)',
      desc: 'Ente oficial de registro de patentes y derechos de autor de software en Venezuela.',
      url: 'https://sapi.gob.ve'
    }
  ];

  return (
    <div style={{ 
      padding: '0 10px 40px 0', 
      fontFamily: 'Outfit, sans-serif', 
      animation: 'fadeIn 0.4s ease',
      height: 'calc(100vh - 125px)',
      overflowY: 'auto'
    }}>
      {/* Encabezado Principal */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: 'var(--accent-gradient)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)'
          }}>
            <Scale size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Marco Legal & Propiedad Intelectual
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Términos de uso corporativo, amparo legal venezolano y derechos de autor de TripoliERP.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '24px',
        borderBottom: '1px solid var(--border-color)', paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('framework')}
          style={{
            padding: '10px 18px', borderRadius: '12px',
            background: activeTab === 'framework' ? 'var(--accent-gradient)' : 'transparent',
            border: activeTab === 'framework' ? 'none' : '1px solid var(--border-color)',
            color: 'white', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <Landmark size={16} />
          Marco Legal Venezolano
        </button>
        <button
          onClick={() => setActiveTab('copyright')}
          style={{
            padding: '10px 18px', borderRadius: '12px',
            background: activeTab === 'copyright' ? 'var(--accent-gradient)' : 'transparent',
            border: activeTab === 'copyright' ? 'none' : '1px solid var(--border-color)',
            color: 'white', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <Copyright size={16} />
          Derechos de Autor (L.D.A.)
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          style={{
            padding: '10px 18px', borderRadius: '12px',
            background: activeTab === 'terms' ? 'var(--accent-gradient)' : 'transparent',
            border: activeTab === 'terms' ? 'none' : '1px solid var(--border-color)',
            color: 'white', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <FileText size={16} />
          Términos de Uso & Licencia
        </button>
        <button
          onClick={() => setActiveTab('links')}
          style={{
            padding: '10px 18px', borderRadius: '12px',
            background: activeTab === 'links' ? 'var(--accent-gradient)' : 'transparent',
            border: activeTab === 'links' ? 'none' : '1px solid var(--border-color)',
            color: 'white', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <ExternalLink size={16} />
          Enlaces Externos Oficiales
        </button>
      </div>

      {/* Contenido Dinámico según Tab activa */}
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        zIndex: 5
      }}>
        
        {/* TAB 1: MARCO LEGAL */}
        {activeTab === 'framework' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 16px 0', color: 'white' }}>
              Legislación de Soporte para la Operativa del Sistema
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Este software ha sido diseñado, programado e implementado integrando las exigencias, normas y protecciones de las leyes vigentes de la República Bolivariana de Venezuela. Su validez operativa y el blindaje de datos se fundamentan en:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '16px', padding: '20px'
              }}>
                <h4 style={{ color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: '700', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} />
                  Validez del Registro Digital
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                  Según el <strong>Artículo 4</strong> de la <em>Ley sobre Mensajes de Datos y Firmas Electrónicas</em>, los registros digitales generados en este sistema tienen el mismo valor y eficacia probatoria que las firmas o documentos impresos. El correlativo alfanumérico generado de 6 o 7 dígitos sirve como firma de control de validez operacional.
                </p>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '16px', padding: '20px'
              }}>
                <h4 style={{ color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: '700', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} />
                  Seguridad de la Información
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                  La <em>Ley Especial contra los Delitos Informáticos</em> (Artículos 6, 7 y 8) penaliza rigurosamente la manipulación fraudulenta de bases de datos, los accesos indebidos y el sabotaje de sistemas informáticos corporativos. Esto protege la inalterabilidad de los despachos de TripoliERP.
                </p>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '16px', padding: '20px', gridColumn: 'span 2'
              }}>
                <h4 style={{ color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: '700', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={18} />
                  Simplificación del Trabajo Operativo
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                  De acuerdo con los postulados constitucionales y la <em>Ley de Simplificación de Trámites Administrativos</em>, este sistema busca optimizar las horas de trabajo operativas en Tripoliven C.A. mediante la total automatización del flujo de despacho de camiones, reduciendo a cero el retrabajo y la duplicidad de información.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DERECHOS DE AUTOR */}
        {activeTab === 'copyright' && (
          <div>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start'
            }}>
              <Info size={28} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: '700', margin: '0 0 6px 0' }}>
                  Declaratoria de Propiedad Intelectual Originaria
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                  El desarrollo, código fuente, arquitectura de base de datos y diseño de interfaz de TripoliERP son creaciones intelectuales exclusivas del desarrollador independiente bajo la firma comercial **Vive flow dev**. Este software ha sido desarrollado de forma externa e individual para automatizar el trabajo personal de su creador, y no constituyó una asignación de tareas específicas en su contrato de relación laboral ordinaria.
                </p>
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 16px 0', color: 'white' }}>
              Base de Amparo Legal: Ley sobre el Derecho de Autor (Venezuela)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderLeft: '3px solid var(--accent-secondary)', paddingLeft: '16px' }}>
                <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                  Artículo 16 (Derechos Morales de Autor)
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                  Declara que el derecho moral del creador sobre su obra de software es inalienable, inembargable, imprescriptible e irrenunciable. Ninguna junta directiva, supervisor o entidad corporativa puede atribuirse la creación ni despojar el crédito autoral de **Vive flow dev**.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--accent-secondary)', paddingLeft: '16px' }}>
                <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                  Artículo 59 y 60 (Obras Creadas en Relación de Empleo)
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                  Establece que las obras de software desarrolladas por un trabajador que exceden sus asignaciones contractuales explícitas permanecen bajo la titularidad originaria del creador. A falta de un contrato escrito de cesión de propiedad de código firmado expresamente por el autor y debidamente remunerado, Tripoliven C.A. únicamente ostenta una licencia no exclusiva de uso funcional para fines internos.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--accent-secondary)', paddingLeft: '16px' }}>
                <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                  Protección del Logotipo y Marca "Vive flow dev"
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                  Toda copia física, digital, exportación de bases de datos o reportes PDF emitidos por este sistema incluirá de forma permanente e inalterable el logotipo, firma digital y marcas corporativas de **Vive flow dev** en certificación del creador del software, como reconocimiento a su valor técnico e innovación tecnológica dentro de la organización.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TÉRMINOS Y CONDICIONES */}
        {activeTab === 'terms' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 16px 0', color: 'white' }}>
              Términos de Licencia de Uso Operativo
            </h3>

            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '16px' }}>
                Al utilizar el sistema TripoliERP dentro de la planta corporativa o dependencias de Tripoliven C.A., la empresa y sus empleados aceptan plenamente los siguientes términos:
              </p>
              
              <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li>
                  <strong style={{ color: 'white' }}>Licencia de Uso Funcional:</strong> Se otorga a Tripoliven C.A. una licencia de carácter gratuito, temporal, no exclusiva y revocable para la utilización operativa del sistema en el registro de camiones, control de despachos y auditoría de clientes.
                </li>
                <li>
                  <strong style={{ color: 'white' }}>Propiedad del Código:</strong> El código fuente (HTML, JavaScript, CSS), bases de datos SQLite y la configuración de compilación en Electron pertenecen en su totalidad a **Vive flow dev**. Queda estrictamente prohibida la copia, reventa, decompilación, distribución no autorizada o alteración de firmas del autor sin consentimiento expreso por escrito.
                </li>
                <li>
                  <strong style={{ color: 'white' }}>Exclusión de Responsabilidad:</strong> El software se suministra "tal cual" (AS IS). Al haber sido un desarrollo proactivo realizado por iniciativa propia del autor para facilitar el flujo del departamento, el creador no asume responsabilidad civil, mercantil, laboral o pecuniaria por pérdidas de datos accidentales, fallos de red ajenos o errores en la manipulación operativa por parte de terceros.
                </li>
                <li>
                  <strong style={{ color: 'white' }}>Reconocimiento y Mérito Técnico:</strong> La permanencia del software en los servidores corporativos está sujeta a que la gerencia general de la empresa reconozca formalmente el mérito técnico de su desarrollador, quien en su condición de empleado de planta ha invertido recursos individuales, horas de investigación y excelencia de ingeniería para dotar a la empresa de una solución de software de vanguardia nacional.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 4: ENLACES */}
        {activeTab === 'links' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 16px 0', color: 'white' }}>
              Recursos y Enlaces Legales Oficiales
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Para la consulta directa e inmediata por parte de auditores corporativos, abogados consultores o la junta directiva de Tripoliven C.A., se ponen a disposición los enlaces oficiales a la legislación aplicada:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {links.map((link, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '14px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', gap: '20px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>{link.title}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{link.desc}</span>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 14px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                      color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.8rem',
                      fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.target.style.background = 'var(--accent-gradient)'; e.target.style.color = 'white'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.color = 'var(--accent-primary)'; }}
                  >
                    Abrir Ley
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Legal;
